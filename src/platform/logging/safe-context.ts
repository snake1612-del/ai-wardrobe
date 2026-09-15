type SafeLogValue = boolean | number | string | null;

export type SafeLogContext = Readonly<Record<string, SafeLogValue>>;

const forbiddenKey =
  /(authorization|cookie|secret|token|password|signed.?url|notes?|payload|photo|image)/i;

export function sanitizeLogContext(context: SafeLogContext): SafeLogContext {
  return Object.fromEntries(Object.entries(context).filter(([key]) => !forbiddenKey.test(key)));
}
