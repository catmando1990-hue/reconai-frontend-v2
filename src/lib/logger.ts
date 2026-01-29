/**
 * Structured Logger - ReconAI Canonical Logging
 *
 * RULES:
 * - All API routes use this logger instead of console.*
 * - PII is automatically redacted
 * - request_id is included in all log entries
 * - Log levels: error, warn, info, debug
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  request_id?: string;
  user_id?: string;
  [key: string]: unknown;
}

// PII patterns to redact
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // credit cards
  /access_token['":\s]+['"]?[a-zA-Z0-9_-]+['"]?/gi, // tokens
  /\bplaid-[a-zA-Z0-9-]+\b/gi, // Plaid tokens
];

function redactPII(message: string): string {
  let redacted = message;
  for (const pattern of PII_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const timestamp = new Date().toISOString();
  const redactedMessage = redactPII(message);
  const logEntry = {
    timestamp,
    level,
    message: redactedMessage,
    ...context,
  };
  return JSON.stringify(logEntry);
}

export const logger = {
  error: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "production") {
      console.error(formatLog("error", message, context));
    } else {
      console.error(`[ERROR] ${message}`, context);
    }
  },

  warn: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "production") {
      console.warn(formatLog("warn", message, context));
    } else {
      console.warn(`[WARN] ${message}`, context);
    }
  },

  info: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "production") {
      console.info(formatLog("info", message, context));
    } else {
      console.info(`[INFO] ${message}`, context);
    }
  },

  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`, context);
    }
  },
};

export type { LogContext };
