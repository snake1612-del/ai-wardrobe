export function isTrustedSameOrigin(
  origin: string | null,
  host: string | null,
  forwardedProtocol: string | null,
  applicationOrigin: string,
): boolean {
  const requestHost = host?.trim();
  const requestProtocol = forwardedProtocol?.trim();
  if (!origin || !requestHost || !requestProtocol) return false;
  if (requestHost.includes(",") || requestProtocol.includes(",")) return false;

  try {
    const parsedOrigin = new URL(origin);
    const parsedApplicationOrigin = new URL(applicationOrigin);
    if (
      parsedOrigin.origin !== origin ||
      parsedApplicationOrigin.origin !== applicationOrigin ||
      parsedOrigin.origin !== parsedApplicationOrigin.origin
    ) {
      return false;
    }
    return (
      requestHost === parsedApplicationOrigin.host &&
      `${requestProtocol}:` === parsedApplicationOrigin.protocol
    );
  } catch {
    return false;
  }
}
