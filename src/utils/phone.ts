const UZBEKISTAN_PHONE_PREFIX = "+998";

export function normalizeUzbekPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("998") ? digits.slice(3) : digits;
  return withoutCountryCode.slice(0, 9);
}

export function formatUzbekPhone(value: string) {
  const digits = normalizeUzbekPhone(value);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);

  return parts.length ? `${UZBEKISTAN_PHONE_PREFIX} ${parts.join("-")}` : `${UZBEKISTAN_PHONE_PREFIX} `;
}

export function toApiPhone(value: string) {
  return `${UZBEKISTAN_PHONE_PREFIX}${normalizeUzbekPhone(value)}`;
}

export function maskStoredPhone(value: string | null | undefined) {
  if (!value) return `${UZBEKISTAN_PHONE_PREFIX} .. ... .. ..`;
  return formatUzbekPhone(value);
}
