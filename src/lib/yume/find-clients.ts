import { yumeApi } from "./api";
import type { YumeClient } from "./api";
import { phoneSearchVariants } from "@/lib/phone";

export type FindClientCandidatesInput = {
  iin?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Ищет CRM-клиентов в Yume через fulltext `searchClients` по ИИН, email и телефону.
 * Порядок запросов: ИИН → email → телефон (ИИН — самый надёжный идентификатор).
 *
 * Телефон ищется во всех записях сразу (`+7…`, `7…`, `8…`): в CRM номер мог быть
 * заведён в любом формате, и поиск по одной записи промахивается.
 *
 * Возвращает дедуплицированный по `id` список кандидатов.
 */
export async function findClientCandidates(
  input: FindClientCandidatesInput
): Promise<YumeClient[]> {
  const candidates = new Map<number, YumeClient>();
  const stats: string[] = [];

  async function collect(criterion: string, query: string) {
    const found = await yumeApi.searchClients(query);
    for (const c of found) candidates.set(c.id, c);
    stats.push(`${criterion}(${mask(query)})=${found.length}`);
  }

  if (input.iin) {
    await collect("iin", input.iin);
  }
  if (input.email) {
    await collect("email", input.email);
  }
  if (input.phone) {
    for (const variant of phoneSearchVariants(input.phone)) {
      await collect("phone", variant);
    }
  }

  const result = [...candidates.values()];
  // Без этой строки промах поиска неотличим от «клиента правда нет в CRM»:
  // снаружи видно только, что регистрация завершилась созданием дубля.
  console.log(
    `[FindClients] ${stats.join(" ") || "критериев нет"} → ${
      result.length ? result.map((c) => `#${c.id}`).join(", ") : "не найдено"
    }`
  );

  return result;
}

/** Прячет середину значения: лог уходит и в прод, ИИН и телефон целиком там не нужны. */
function mask(value: string): string {
  if (value.includes("@")) return value;
  if (value.length <= 7) return value;
  return `${value.slice(0, 4)}***${value.slice(-3)}`;
}
