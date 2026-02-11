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
      reporter: ["text", "text-summary", "lcov"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.d.ts", "src/**/__snapshots__/**", "src/**/README.md"],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 55,
        statements: 60,
      },
    },
  },
} satisfies import("vite").UserConfig & VitestInlineConfig

export default defineConfig(config)
