export function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try { return JSON.parse(imageUrl); } catch { return [imageUrl]; }
  }
  return [imageUrl];
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function getDateLabel(dateString: string, translate?: (key: string) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return translate ? translate("common.today") : "Today";
  if (isYesterday) return translate ? translate("common.yesterday") : "Yesterday";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { day: "numeric", month: "long" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function areDifferentDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() !== d2.getDate() || d1.getMonth() !== d2.getMonth() || d1.getFullYear() !== d2.getFullYear();
}
