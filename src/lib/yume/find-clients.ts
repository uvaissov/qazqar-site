import { yumeApi } from "./api";
import type { YumeClient } from "./api";

export type FindClientCandidatesInput = {
  iin?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Ищет CRM-клиентов в Yume через fulltext `searchClients` по ИИН, email и телефону.
 * Порядок запросов: ИИН → email → телефон (ИИН — самый надёжный идентификатор).
 * Возвращает дедуплицированный по `id` список кандидатов.
 */
export async function findClientCandidates(
  input: FindClientCandidatesInput
): Promise<YumeClient[]> {
  const candidates = new Map<number, YumeClient>();

  if (input.iin) {
    for (const c of await yumeApi.searchClients(input.iin)) {
      candidates.set(c.id, c);
    }
  }
  if (input.email) {
    for (const c of await yumeApi.searchClients(input.email)) {
      candidates.set(c.id, c);
    }
  }
  if (input.phone) {
    for (const c of await yumeApi.searchClients(input.phone)) {
      candidates.set(c.id, c);
    }
  }

  return [...candidates.values()];
}
