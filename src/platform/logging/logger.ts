import "server-only";

import { sanitizeLogContext, type SafeLogContext } from "./safe-context";

export function logEvent(
  level: "info" | "warn" | "error",
  operation: string,
  context: SafeLogContext = {},
): void {
  const event = {
    timestamp: new Date().toISOString(),
    level,
    operation,
    ...sanitizeLogContext(context),
  };

  const line = JSON.stringify(event);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
