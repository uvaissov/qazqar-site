import { defineConfig } from "vitest/config";

// Alias «@/» как в tsconfig — иначе модули с импортами вида "@/lib/phone"
// нельзя протестировать.
export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
