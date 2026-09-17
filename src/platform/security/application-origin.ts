import { z } from "zod";

const applicationOriginSchema = z.url();

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

export function parseApplicationOrigin(
  value: string | undefined,
  allowPrivateNetworkHttp = false,
): string {
  const candidate = applicationOriginSchema.parse(value);
  const parsed = new URL(candidate);
  if (parsed.origin !== candidate) throw new Error("APP_ORIGIN must contain only scheme and host");
  const isAllowedLocalHttp =
    parsed.protocol === "http:" &&
    (parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      (allowPrivateNetworkHttp && isPrivateIpv4(parsed.hostname)));
  if (parsed.protocol !== "https:" && !isAllowedLocalHttp) {
    throw new Error("APP_ORIGIN must use HTTPS outside local development");
  }
  return parsed.origin;
}
