type LogLevel = "error" | "warn" | "info" | "debug" | "silent"

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  silent: 4,
}

const DEFAULT_LOG_LEVEL: LogLevel = "warn"

function readEnvValue(key: string): string | undefined {
  const serverEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env
  if (serverEnv && serverEnv[key]) {
    return serverEnv[key]
  }
  const meta = import.meta as unknown as {
    env?: Record<string, string | undefined>
  }
  return meta.env?.[key]
}

function resolveLogLevel(): LogLevel {
  const raw = readEnvValue("LATTICE_LOG_LEVEL") ?? readEnvValue("LOG_LEVEL")
  const normalized = raw?.trim().toLowerCase()
  if (normalized && normalized in LEVEL_ORDER) {
    return normalized as LogLevel
  }
  return DEFAULT_LOG_LEVEL
}

function safeStringify(input: unknown): string {
  try {
    return JSON.stringify(input)
  } catch {
    return "\"[unserializable]\""
  }
}

function formatMessage(scope: string, message: string, meta?: unknown): string {
  if (meta === undefined) {
    return `[lattice:${scope}] ${message}`
  }
  return `[lattice:${scope}] ${message} ${safeStringify(meta)}`
}

export interface Logger {
  error: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  info: (message: string, meta?: unknown) => void
  debug: (message: string, meta?: unknown) => void
}

export function createLogger(scope: string): Logger {
  const level = resolveLogLevel()
  const isEnabled = (target: LogLevel) =>
    LEVEL_ORDER[target] <= LEVEL_ORDER[level]

  return {
    error(message, meta) {
      if (!isEnabled("error")) {
        return
      }
      console.error(formatMessage(scope, message, meta))
    },
    warn(message, meta) {
      if (!isEnabled("warn")) {
        return
      }
      console.warn(formatMessage(scope, message, meta))
    },
    info(message, meta) {
      if (!isEnabled("info")) {
        return
      }
      console.info(formatMessage(scope, message, meta))
    },
    debug(message, meta) {
      if (!isEnabled("debug")) {
        return
      }
      console.debug(formatMessage(scope, message, meta))
    },
  }
}
