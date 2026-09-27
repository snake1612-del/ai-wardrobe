function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isLocalHttpOrigin(value: URL): boolean {
  return (
    value.protocol === "http:" &&
    (value.hostname === "localhost" ||
      value.hostname === "127.0.0.1" ||
      isPrivateIpv4(value.hostname))
  );
}

export function isTrustedSameOrigin(
  origin: string | null,
  host: string | null,
  forwardedProtocol: string | null,
  applicationOrigin: string,
  allowLocalAliases = false,
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
      requestProtocol + ":" !== parsedOrigin.protocol ||
      requestHost !== parsedOrigin.host
    ) {
      return false;
    }
    if (parsedOrigin.origin === parsedApplicationOrigin.origin) return true;
    return (
      allowLocalAliases &&
      parsedOrigin.port === parsedApplicationOrigin.port &&
      isLocalHttpOrigin(parsedOrigin) &&
      isLocalHttpOrigin(parsedApplicationOrigin)
    );
  } catch {
    return false;
  }
}
