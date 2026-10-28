import { afterEach, expect, it, vi } from "vitest";
import { captureAcquisition } from "./acquisition";
afterEach(() => vi.unstubAllGlobals());
it("preserves the first organic landing without keeping referrer query strings", () => {
  const values = new Map<string, string>();
  const sessionStorage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
  vi.stubGlobal("window", { location: { href: "https://qazqar.kz/ru/cars/elantra" }, sessionStorage });
  vi.stubGlobal("document", { referrer: "https://www.google.kz/search?q=private-query" });
  expect(captureAcquisition()).toEqual({ source: "www.google.kz", medium: "organic", landingPath: "/ru/cars/elantra" });
  window.location.href = "https://qazqar.kz/ru/catalog/car-1";
  expect(captureAcquisition()?.landingPath).toBe("/ru/cars/elantra");
  expect(JSON.stringify([...values.values()])).not.toContain("private-query");
});
it("does not break booking when browser storage is blocked", () => {
  vi.stubGlobal("window", { sessionStorage: { getItem: () => { throw new Error("blocked"); } } });
  expect(captureAcquisition()).toBeUndefined();
});
