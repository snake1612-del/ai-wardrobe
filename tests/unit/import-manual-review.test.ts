import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) =>
    createElement("img", { src: props.src, alt: props.alt }),
}));
vi.mock("@/i18n/context", () => ({
  useI18n: () => ({
    locale: "ru",
    t: (key: string) => key,
  }),
}));

import { ImportReview } from "../../src/modules/import/components/import-review";

describe("manual import Review", () => {
  it("requires an explicit decision per opaque asset and separates Resolve from Preview", () => {
    const html = renderToStaticMarkup(
      createElement(ImportReview, {
        sessionId: "00000000-0000-4000-8000-000000000001",
        initialState: "review",
        initialVersion: 5,
        revision: 0,
        manifestHash: null,
        assets: [
          {
            media_asset_id: "00000000-0000-4000-8000-000000000011",
            version: 1,
            source_reference: "p0:e0",
            proposed_role: "evidence_source",
            proposed_view: "unspecified",
            processing_state: "ready",
            rendition: {
              id: "00000000-0000-4000-8000-000000000021",
              width_px: 480,
              height_px: 480,
            },
          },
          {
            media_asset_id: "00000000-0000-4000-8000-000000000012",
            version: 1,
            source_reference: "p0:e1",
            proposed_role: "catalog",
            proposed_view: "unspecified",
            processing_state: "ready",
            rendition: {
              id: "00000000-0000-4000-8000-000000000022",
              width_px: 480,
              height_px: 480,
            },
          },
        ],
        issues: [{ code: "asset_probable_duplicate", count: 1, severity: "warning" }],
        items: [],
        categories: [{ id: "00000000-0000-4000-8000-000000000031", code: "tops", label: "Tops" }],
        records: [],
      }),
    );

    expect(html).toContain("p0:e0");
    expect(html).toContain("p0:e1");
    expect(html).toContain("/api/media/renditions/00000000-0000-4000-8000-000000000021");
    expect(html.match(/value="unresolved"/gu) ?? []).toHaveLength(2);
    expect(html).toContain("Сохранить Resolve без Preview");
    expect(html).toContain("Построить Sealed Preview");
    expect(html).not.toContain("Confirm import");
  });
  it("shows automatic ZIP processing rather than an endless generic spinner", () => {
    const html = renderToStaticMarkup(
      createElement(ImportReview, {
        sessionId: "00000000-0000-4000-8000-000000000001",
        initialState: "uploaded",
        initialVersion: 1,
        revision: 1,
        manifestHash: null,
        assets: [],
        issues: [],
        items: [],
        categories: [],
        records: [],
      }),
    );
    expect(html).toContain("Загрузка завершена. Ожидаем обработку ZIP");
    expect(html).not.toContain("Состояние обновляется автоматически");
    expect(html).not.toContain("Confirm import");
  });

  it("offers a safe per-image retry only for failed, not quarantined thumbnails", () => {
    const html = renderToStaticMarkup(
      createElement(ImportReview, {
        sessionId: "00000000-0000-4000-8000-000000000001",
        initialState: "review",
        initialVersion: 2,
        revision: 1,
        manifestHash: null,
        assets: [
          {
            media_asset_id: "00000000-0000-4000-8000-000000000011",
            version: 3,
            source_reference: "p0:e0",
            proposed_role: null,
            proposed_view: null,
            processing_state: "failed",
            rendition: null,
          },
          {
            media_asset_id: "00000000-0000-4000-8000-000000000012",
            version: 3,
            source_reference: "p0:e1",
            proposed_role: null,
            proposed_view: null,
            processing_state: "quarantined",
            rendition: null,
          },
        ],
        issues: [],
        items: [],
        categories: [],
        records: [],
      }),
    );
    expect(html.match(/Повторить подготовку изображения/gu) ?? []).toHaveLength(1);
    expect(html).toContain("Изображение отклонено проверкой безопасности");
    expect(html).not.toContain("Confirm import");
  });
});
