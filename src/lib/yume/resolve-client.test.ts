import { beforeEach, expect, test, vi } from "vitest";
const api = vi.hoisted(() => ({ searchClients: vi.fn(), createClient: vi.fn() }));
vi.mock("./api", () => ({ yumeApi: api }));
import { resolveClient } from "./resolve-client";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  api.searchClients.mockImplementation(async (query: string) =>
    ["+77012219116", "77012219116"].includes(query) ? [{ id: 3466 }] : []);
});

test("находит Медера только по телефону, когда ИИН и email не совпадают", async () => {
  expect(await resolveClient({ name: "Аматов Медер", iin: "not-matching", email: "meder.amatov@gmail.com", phone: "+77012219116" })).toBe(3466);
  expect(api.searchClients.mock.calls.map(([query]) => query)).toEqual([
    "not-matching", "meder.amatov@gmail.com", "+77012219116", "77012219116", "87012219116",
  ]);
  expect(api.createClient).not.toHaveBeenCalled();
});
test("находит существующего клиента, когда известен только телефон", async () => {
  expect(await resolveClient({ name: "Медер", phone: "+77012219116" })).toBe(3466);
  expect(api.createClient).not.toHaveBeenCalled();
});
test("создаёт CRM-клиента только если все критерии поиска дали ноль", async () => {
  api.searchClients.mockResolvedValue([]);
  api.createClient.mockResolvedValue({ id: 999 });
  expect(await resolveClient({ name: "Новый клиент", phone: "+77012219116" })).toBe(999);
  expect(api.createClient).toHaveBeenCalledTimes(1);
});
