import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoBase = "/agent-lattice/";

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
