export function normalizeInstagramLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const username = trimmed.replace(/^@+/, "");
  return `https://instagram.com/${username}`;
}

export function normalizeTelegramLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const username = trimmed.replace(/^@+/, "");
  return `https://t.me/${username}`;
}

export function normalizeInstagramValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `@${trimmed.replace(/^@+/, "")}`;
}

export function normalizeTelegramValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `@${trimmed.replace(/^@+/, "")}`;
}
