const userStatePrefix = "ai-wardrobe:";
const persistentOwnerKey = `${userStatePrefix}state-owner`;
const activeTabUserKey = `${userStatePrefix}active-user`;

type StorageLike = Pick<Storage, "getItem" | "key" | "length" | "removeItem" | "setItem">;

export function removeUserScopedKeys(storage: StorageLike): void {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key?.startsWith(userStatePrefix)) storage.removeItem(key);
  }
}

export function clearUserScopedClientState(): void {
  if (typeof window === "undefined") return;
  removeUserScopedKeys(window.localStorage);
  removeUserScopedKeys(window.sessionStorage);
}

export function bindClientStateToStorage(
  authUserId: string,
  localStorage: StorageLike,
  sessionStorage: StorageLike,
): void {
  const persistentOwner = localStorage.getItem(persistentOwnerKey);
  const activeTabUser = sessionStorage.getItem(activeTabUserKey);

  if (persistentOwner !== authUserId || (activeTabUser !== null && activeTabUser !== authUserId)) {
    removeUserScopedKeys(localStorage);
    removeUserScopedKeys(sessionStorage);
  }

  localStorage.setItem(persistentOwnerKey, authUserId);
  sessionStorage.setItem(activeTabUserKey, authUserId);
}

export function bindClientStateToUser(authUserId: string): void {
  if (typeof window === "undefined") return;
  bindClientStateToStorage(authUserId, window.localStorage, window.sessionStorage);
}
