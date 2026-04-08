import { translate } from "@/lib/i18n";

export function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return translate("time.justNow");
  if (diffMins < 60) return `${diffMins} ${translate("time.minutesAgo")}`;
  if (diffHours < 24) return `${diffHours} ${translate("time.hoursAgo")}`;
  if (diffDays === 1) return translate("time.yesterday");
  if (diffDays < 7) return `${diffDays} ${translate("time.daysAgo")}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${translate("time.weeksAgo")}`;
  
  const month = date.getMonth() + 1;
  return `${date.getDate()} ${translate(`time.monthShort${month}`)}`;
}

export function formatDateWithTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  const time = `${hours}:${mins}`;
  if (diffDays === 0) {
    return `${translate("formatters.today")}, ${time}`;
  }
  if (diffDays === 1) {
    return `${translate("formatters.yesterday")}, ${time}`;
  }
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const yearStr = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : "";
  return `${day} ${translate(`time.monthShort${month}`)}${yearStr}, ${time}`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  return `${date.getDate()} ${translate(`time.monthShort${month}`)} ${date.getFullYear()}`;
}

export function getRemainingText(expiresAt: string): string {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;
  if (diffMs <= 0) return translate("remaining.expired");
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return translate("remaining.lessThanHour");
  if (diffHours < 24) return `${diffHours} ${translate("remaining.hours")}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${pluralize(diffDays, translate("remaining.day1"), translate("remaining.day234"), translate("remaining.day5"))}`;
}
