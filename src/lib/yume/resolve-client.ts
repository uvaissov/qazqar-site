import { findClientCandidates, type FindClientCandidatesInput } from "./find-clients";
import { yumeApi } from "./api";

/** Общий поиск/создание клиента для обычной и быстрой регистрации. */
export async function resolveClient(input: FindClientCandidatesInput & { name: string }) {
  const candidates = await findClientCandidates(input);
  if (candidates.length) return candidates[0].id;
  const created = await yumeApi.createClient({
    name: input.name,
    ...(input.email && { email: input.email }),
    ...(input.phone && { phone: input.phone }),
    ...(input.iin && { iin: input.iin }),
  });
  return created.id;
}
