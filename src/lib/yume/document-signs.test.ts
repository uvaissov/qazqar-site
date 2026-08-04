import { describe, expect, test } from "vitest";
import { isSignSigned, mapDocument, missingTemplates } from "./document-signs";
import type { YumeDocument, YumeDocumentTemplate } from "./api";

// Статусы взяты с боевых документов Yume:
//   client/0 — не подписан, client/2 — водитель подписал, company/5 — компания подписала.
function sign(type: string, status: number, uuid = `uuid-${type}-${status}`) {
  return {
    id: 1,
    uuid,
    method: 0,
    status,
    signer: { id: 1, name: `Подписант ${type}`, phone: "", email: "", type },
  };
}

function doc(partial: Partial<YumeDocument>): YumeDocument {
  return {
    id: 428451,
    uuid: "doc-uuid",
    name: "Акт приема передачи - 2134",
    template: 161,
    signed: false,
    files: [],
    signs: [],
    created_at: "2026-08-04T20:33:00+05:00",
    ...partial,
  } as YumeDocument;
}

describe("isSignSigned", () => {
  test("подпись водителя со статусом 2 считается поставленной", () => {
    expect(isSignSigned(2)).toBe(true);
  });

  test("подпись компании со статусом 5 считается поставленной", () => {
    expect(isSignSigned(5)).toBe(true);
  });

  test("статус 0 — не подписан", () => {
    expect(isSignSigned(0)).toBe(false);
  });
});

describe("missingTemplates", () => {
  const templates: YumeDocumentTemplate[] = [
    { id: 160, name: "Договор аренды", content_type: "orderrequest", status: "active" },
    { id: 161, name: "Акт приема передачи", content_type: "orderrequest", status: "active" },
    { id: 753, name: "Путевой акт", content_type: "orderrequest", status: "archived" },
  ];

  test("для заявки без документов возвращает все активные шаблоны", () => {
    expect(missingTemplates([], templates).map((t) => t.id)).toEqual([160, 161]);
  });

  test("неактивные шаблоны не генерируются", () => {
    expect(missingTemplates([], templates).map((t) => t.id)).not.toContain(753);
  });

  test("уже созданный документ повторно не генерируется", () => {
    const existing = [doc({ id: 1, template: 160 })];
    expect(missingTemplates(existing, templates).map((t) => t.id)).toEqual([161]);
  });

  test("когда все документы на месте — пусто", () => {
    const existing = [doc({ id: 1, template: 160 }), doc({ id: 2, template: 161 })];
    expect(missingTemplates(existing, templates)).toEqual([]);
  });

  test("шаблоны для других сущностей игнорируются", () => {
    const foreign: YumeDocumentTemplate[] = [
      { id: 900, name: "Счёт", content_type: "invoice", status: "active" },
    ];
    expect(missingTemplates([], foreign)).toEqual([]);
  });
});

describe("mapDocument", () => {
  test("из имени убирается номер заявки", () => {
    expect(mapDocument(doc({})).name).toBe("Акт приема передачи");
  });

  test("ссылка ведёт на подпись водителя, а не на документ", () => {
    const d = doc({ signs: [sign("company", 5), sign("client", 0, "client-uuid")] });
    expect(mapDocument(d).docUrl).toBe("https://yume.kz/documents/client-uuid");
  });

  test("без подписанта-водителя ссылка деградирует до самого документа", () => {
    const d = doc({ signs: [sign("company", 5)] });
    expect(mapDocument(d).docUrl).toBe("https://yume.kz/documents/doc-uuid");
  });

  test("подписан обеими сторонами — allSigned", () => {
    const d = doc({ signs: [sign("client", 2), sign("company", 5)] });
    const m = mapDocument(d);
    expect(m.allSigned).toBe(true);
    expect(m.partiallySigned).toBe(false);
  });

  test("водитель подписал, компания нет — partiallySigned", () => {
    const d = doc({ signs: [sign("client", 2), sign("company", 0)] });
    const m = mapDocument(d);
    expect(m.allSigned).toBe(false);
    expect(m.partiallySigned).toBe(true);
  });

  test("подпись водителя засчитывается в signers", () => {
    const d = doc({ signs: [sign("client", 2)] });
    expect(mapDocument(d).signers[0]).toMatchObject({ type: "client", signed: true });
  });

  test("никто не подписал — обе метки false", () => {
    const d = doc({ signs: [sign("client", 0), sign("company", 0)] });
    const m = mapDocument(d);
    expect(m.allSigned).toBe(false);
    expect(m.partiallySigned).toBe(false);
  });
});
