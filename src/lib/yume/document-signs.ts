import type { YumeDocument, YumeDocumentTemplate } from "./api";

// Статусы подписи в Yume различаются по стороне:
//   0 — не подписан, 2 — подписал клиент, 5 — подписала компания.
// Раньше здесь стояло `status === 5`, из-за чего подпись водителя не
// засчитывалась никогда и подписанный им документ выглядел неподписанным.
const SIGNED_STATUSES = new Set([2, 5]);

export function isSignSigned(status: number): boolean {
  return SIGNED_STATUSES.has(status);
}

/**
 * Шаблоны, по которым для заявки ещё не создан документ.
 *
 * Список шаблонов берётся из CRM, а не хардкодится: там уже появился новый
 * «Путевой акт» (#753) сверх исторических 160/161/162, и захардкоженный
 * перечень его бы не заметил. Неактивные шаблоны пропускаются — в CRM это
 * признак того, что документ больше не выдают.
 */
export function missingTemplates(
  docs: YumeDocument[],
  templates: YumeDocumentTemplate[]
): YumeDocumentTemplate[] {
  const created = new Set(docs.map((d) => d.template).filter((t) => t !== null));
  return templates.filter(
    (t) =>
      t.status === "active" &&
      t.content_type === "orderrequest" &&
      !created.has(t.id)
  );
}

export type MappedSigner = {
  name: string;
  type: string;
  signed: boolean;
  signUrl: string;
};

export type MappedDocument = {
  name: string;
  allSigned: boolean;
  partiallySigned: boolean;
  docUrl: string;
  signers: MappedSigner[];
};

/** Приводит документ CRM к виду, который лежит в `Booking.documents` и уходит в UI. */
export function mapDocument(doc: YumeDocument): MappedDocument {
  const signers: MappedSigner[] = doc.signs.map((s) => ({
    name: s.signer?.name || "",
    type: s.signer?.type || "client",
    signed: isSignSigned(s.status),
    signUrl: `https://yume.kz/documents/${s.uuid}`,
  }));

  // Водителю нужна ссылка именно на его подпись; на сам документ — только
  // если подписанта-клиента у документа нет.
  const clientSign = doc.signs.find((s) => s.signer?.type === "client");
  const docUrl = clientSign
    ? `https://yume.kz/documents/${clientSign.uuid}`
    : `https://yume.kz/documents/${doc.uuid}`;

  const hasClient = signers.some((s) => s.type === "client");
  const hasCompany = signers.some((s) => s.type !== "client");
  const allSigned = hasClient && hasCompany && signers.every((s) => s.signed);
  const partiallySigned = signers.some((s) => s.signed) && !allSigned;

  return {
    name: doc.name.replace(/ - \d+$/, ""),
    allSigned,
    partiallySigned,
    docUrl,
    signers,
  };
}
