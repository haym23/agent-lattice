import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

type VitestInlineConfig = {
  test?: {
    environment: "jsdom"
    setupFiles: string[]
    coverage: {
      provider: "v8"
      reporter: string[]
      include: string[]
      exclude: string[]
      thresholds: {
        lines: number
        functions: number
        branches: number
        statements: number
      }
    }
  }
}

const config = {
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.d.ts", "src/**/__snapshots__/**", "src/**/README.md"],
      thresholds: {
        lines: 70,
        functions: 60,
        branches: 65,
        statements: 70,
      },
    },
  },
} satisfies import("vite").UserConfig & VitestInlineConfig

export default defineConfig(config)
