import { describe, expect, it } from "vitest";

import {
  bindClientStateToStorage,
  removeUserScopedKeys,
} from "../../src/modules/account/client-state";

class MemoryStorage {
  private readonly entries: Map<string, string>;

  constructor(entries: [string, string][] = []) {
    this.entries = new Map(entries);
  }

  get length() {
    return this.entries.size;
  }
  key(index: number) {
    return [...this.entries.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.entries.set(key, value);
  }
  removeItem(key: string) {
    this.entries.delete(key);
  }
  values() {
    return [...this.entries.keys()];
  }
}

describe("removeUserScopedKeys", () => {
  it("clears only AI Wardrobe state", () => {
    const storage = new MemoryStorage([
      ["unrelated", "keep"],
      ["ai-wardrobe:active-user", "user-a"],
      ["ai-wardrobe:draft", "private"],
    ]);
    removeUserScopedKeys(storage);
    expect(storage.values()).toEqual(["unrelated"]);
  });

  it("removes legacy persistent state when its owner marker is absent", () => {
    const local = new MemoryStorage([
      ["unrelated", "keep"],
      ["ai-wardrobe:draft", "user-a-private"],
    ]);
    const session = new MemoryStorage();

    bindClientStateToStorage("user-b", local, session);

    expect(local.getItem("ai-wardrobe:draft")).toBeNull();
    expect(local.getItem("ai-wardrobe:state-owner")).toBe("user-b");
    expect(session.getItem("ai-wardrobe:active-user")).toBe("user-b");
    expect(local.getItem("unrelated")).toBe("keep");
  });

  it("clears persistent state before binding a different owner", () => {
    const local = new MemoryStorage([
      ["ai-wardrobe:state-owner", "user-a"],
      ["ai-wardrobe:draft", "user-a-private"],
    ]);
    const session = new MemoryStorage([["ai-wardrobe:active-user", "user-a"]]);

    bindClientStateToStorage("user-b", local, session);

    expect(local.getItem("ai-wardrobe:draft")).toBeNull();
    expect(local.getItem("ai-wardrobe:state-owner")).toBe("user-b");
    expect(session.getItem("ai-wardrobe:active-user")).toBe("user-b");
  });

  it("preserves state for the same owner in a new tab", () => {
    const local = new MemoryStorage([
      ["ai-wardrobe:state-owner", "user-a"],
      ["ai-wardrobe:draft", "user-a-private"],
    ]);
    const newTabSession = new MemoryStorage();

    bindClientStateToStorage("user-a", local, newTabSession);

    expect(local.getItem("ai-wardrobe:draft")).toBe("user-a-private");
    expect(newTabSession.getItem("ai-wardrobe:active-user")).toBe("user-a");
  });

  it("fails safe when tab and persistent owner markers disagree", () => {
    const local = new MemoryStorage([
      ["ai-wardrobe:state-owner", "user-b"],
      ["ai-wardrobe:draft", "untrusted"],
    ]);
    const session = new MemoryStorage([["ai-wardrobe:active-user", "user-a"]]);

    bindClientStateToStorage("user-b", local, session);

    expect(local.getItem("ai-wardrobe:draft")).toBeNull();
    expect(local.getItem("ai-wardrobe:state-owner")).toBe("user-b");
    expect(session.getItem("ai-wardrobe:active-user")).toBe("user-b");
  });
});
