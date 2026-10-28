import { afterEach, beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("YUME_USERNAME", "test-user");
  vi.stubEnv("YUME_PASSWORD", "test-password");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function createClient(iin?: string) {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ access: "test-token", refresh: "test-refresh" }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 999 }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const { yumeApi } = await import("./api");
  await yumeApi.createClient({ name: "Тестовый клиент", phone: "+77010000000", email: "test@example.com", ...(iin && { iin }) });
  return JSON.parse(fetchMock.mock.calls[1][1].body);
}

test("ИИН нового CRM-клиента передаётся в паспорт физлица, а не в readOnly поле", async () => {
  const payload = await createClient("900101350015");
  expect(payload).toEqual({
    type: 0, name: "Тестовый клиент", phone: "+77010000000", email: "test@example.com",
    individual: { iin: "900101350015" },
  });
  expect(payload).not.toHaveProperty("iin");
});

test("для клиента без ИИН не передаётся пустой паспорт", async () => {
  const payload = await createClient();
  expect(payload.type).toBe(0);
  expect(payload).not.toHaveProperty("individual");
  expect(payload).not.toHaveProperty("iin");
});
