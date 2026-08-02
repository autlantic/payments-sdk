/** Log levels for Autlantic Billing SDK diagnostics. */
export type BillingLogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<BillingLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type BillingLogMeta = Record<string, unknown>;

/**
 * Pluggable logger used by `AutlanticBilling` when `debug` is on
 * or when you inject your own sink (Datadog, Pino, etc.).
 */
export type BillingLogger = {
  debug(message: string, meta?: BillingLogMeta): void;
  info(message: string, meta?: BillingLogMeta): void;
  warn(message: string, meta?: BillingLogMeta): void;
  error(message: string, meta?: BillingLogMeta): void;
};

export type CreateConsoleLoggerOptions = {
  /** Minimum level to emit. Default `info` (or `debug` when `minLevel` omitted and env debug is on). */
  minLevel?: BillingLogLevel;
  /** Prefix for every line. Default `[autlantic-billing]`. */
  prefix?: string;
  /** Override writers (tests). */
  writers?: Partial<Record<BillingLogLevel, (line: string) => void>>;
};

function shouldEmit(minLevel: BillingLogLevel, level: BillingLogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function formatLine(prefix: string, level: BillingLogLevel, message: string, meta?: BillingLogMeta): string {
  if (!meta || Object.keys(meta).length === 0) {
    return `${prefix} ${level}: ${message}`;
  }
  try {
    return `${prefix} ${level}: ${message} ${JSON.stringify(meta)}`;
  } catch {
    return `${prefix} ${level}: ${message} [meta:unserializable]`;
  }
}

/** No-op logger (default when debug is off and no custom logger is provided). */
export const noopBillingLogger: BillingLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

/** Console-backed logger suitable for local development. */
export function createConsoleBillingLogger(options: CreateConsoleLoggerOptions = {}): BillingLogger {
  const minLevel = options.minLevel ?? "info";
  const prefix = options.prefix ?? "[autlantic-billing]";
  const writers: Record<BillingLogLevel, (line: string) => void> = {
    debug: options.writers?.debug ?? ((line) => console.debug(line)),
    info: options.writers?.info ?? ((line) => console.info(line)),
    warn: options.writers?.warn ?? ((line) => console.warn(line)),
    error: options.writers?.error ?? ((line) => console.error(line)),
  };

  const emit = (level: BillingLogLevel, message: string, meta?: BillingLogMeta) => {
    if (!shouldEmit(minLevel, level)) return;
    writers[level](formatLine(prefix, level, message, meta));
  };

  return {
    debug: (message, meta) => emit("debug", message, meta),
    info: (message, meta) => emit("info", message, meta),
    warn: (message, meta) => emit("warn", message, meta),
    error: (message, meta) => emit("error", message, meta),
  };
}

const SENSITIVE_HEADER = /^(x-autlantic-api-key|authorization|cookie|set-cookie)$/i;
const SENSITIVE_KEY = /(secret|api[_-]?key|password|token|authorization|signature)/i;

/** Mask API keys / secrets for safe debug traces. */
export function redactSecret(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  const v = value.trim();
  if (v.length <= 8) return "***";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

/** Deep-ish redact of JSON-ish values for logging. */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.startsWith("abk_") || value.startsWith("whsec_")) return redactSecret(value);
    if (value.length > 2_000) return `${value.slice(0, 200)}…[truncated ${value.length} chars]`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redactForLog(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = typeof child === "string" ? redactSecret(child) : "[redacted]";
      continue;
    }
    out[key] = redactForLog(child, depth + 1);
  }
  return out;
}

export function redactHeadersForLog(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = SENSITIVE_HEADER.test(key) ? (redactSecret(value) ?? "[redacted]") : value;
  });
  return out;
}

export function parseBillingLogLevel(raw: string | undefined): BillingLogLevel | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return undefined;
}

export function isBillingDebugEnv(env: Record<string, string | undefined> = process.env): boolean {
  const v = env.AUTLANTIC_BILLING_DEBUG?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Resolve the effective logger for a client instance.
 * - Custom `logger` always wins.
 * - Else if `debug` / env debug: console logger at debug (or `logLevel`).
 * - Else: noop (silent).
 */
export function resolveBillingLogger(input: {
  logger?: BillingLogger;
  debug?: boolean;
  logLevel?: BillingLogLevel;
  env?: Record<string, string | undefined>;
}): BillingLogger {
  if (input.logger) return input.logger;
  const env = input.env ?? process.env;
  const debug = input.debug ?? isBillingDebugEnv(env);
  const level = input.logLevel ?? parseBillingLogLevel(env.AUTLANTIC_BILLING_LOG_LEVEL);
  if (!debug && !level) return noopBillingLogger;
  return createConsoleBillingLogger({
    minLevel: level ?? (debug ? "debug" : "info"),
  });
}
