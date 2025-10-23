import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/main.ts",
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  ssr: {
    noExternal: ["@riverly/app", "@riverly/utils"],
  },
});
