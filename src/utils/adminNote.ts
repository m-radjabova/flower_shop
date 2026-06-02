export const ADMIN_NOTE_VISIBLE_DAYS = 3;

export function isRecentAdminNote(updatedAt?: string | null, visibleDays = ADMIN_NOTE_VISIBLE_DAYS) {
  if (!updatedAt) return false;

  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(updatedDate.getTime())) return false;

  const diffInDays = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays <= visibleDays;
}
