import type { ImportantDate, ImportantDateEventType } from "../types/types";

type EventTypeMeta = {
  emoji: string;
  gradientClassName: string;
};

export const EVENT_TYPE_META: Record<ImportantDateEventType, EventTypeMeta> = {
  birthday: {
    emoji: "🎂",
    gradientClassName: "from-[#3a1519] to-[#230b0e]",
  },
  anniversary: {
    emoji: "💞",
    gradientClassName: "from-[#2d1021] to-[#180914]",
  },
  custom: {
    emoji: "🌷",
    gradientClassName: "from-[#2a150d] to-[#180c07]",
  },
};

function getSafeOccurrence(year: number, monthIndex: number, day: number) {
  const occurrence = new Date(year, monthIndex, day);

  if (occurrence.getMonth() === monthIndex) {
    return occurrence;
  }

  return new Date(year, monthIndex + 1, 0);
}

export function getNextOccurrenceDate(eventDate: string, now = new Date()) {
  const original = new Date(eventDate);

  if (Number.isNaN(original.getTime())) {
    return null;
  }

  const monthIndex = original.getMonth();
  const day = original.getDate();
  const currentYear = now.getFullYear();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let occurrence = getSafeOccurrence(currentYear, monthIndex, day);

  if (occurrence < todayStart) {
    occurrence = getSafeOccurrence(currentYear + 1, monthIndex, day);
  }

  return occurrence;
}

export function getDaysUntilImportantDate(eventDate: string, now = new Date()) {
  const nextOccurrence = getNextOccurrenceDate(eventDate, now);

  if (!nextOccurrence) {
    return null;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = nextOccurrence.getTime() - todayStart.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function sortImportantDatesByUpcoming(dates: ImportantDate[]) {
  return [...dates].sort((a, b) => {
    const daysA = getDaysUntilImportantDate(a.event_date);
    const daysB = getDaysUntilImportantDate(b.event_date);

    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    if (daysA !== daysB) return daysA - daysB;
    return a.title.localeCompare(b.title);
  });
}

export function formatImportantDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale || "en", {
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getImportantDateMeta(eventType: ImportantDateEventType) {
  return EVENT_TYPE_META[eventType] ?? EVENT_TYPE_META.custom;
}
