import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const repoBase = "/agent-lattice/"

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
