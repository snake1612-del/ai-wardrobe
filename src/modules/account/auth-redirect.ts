const protectedRoot = "/app";
const passwordUpdatePath = "/auth/update-password";

export function getSafeAuthRedirectPath(value: string | null, fallback = protectedRoot): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value === protectedRoot || value.startsWith(`${protectedRoot}/`)) return value;
  if (value === passwordUpdatePath) return value;
  return fallback;
}
