import { defineConfig } from "vitest/config";

// Alias «@/» как в tsconfig — иначе модули с импортами вида "@/lib/phone"
// нельзя протестировать.
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
