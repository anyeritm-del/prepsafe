function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Formats a Date as dd/mm/yyyy HH:mm for the on-screen preview. */
export function formatDateTime(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a Date as dd/mm HH:mm (no year) for the physical TSPL print,
 * where every character costs printable width at large font sizes.
 */
export function formatDateTimeShort(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month} ${hours}:${minutes}`;
}

/** Formats a Date as dd/mm — used to print the EXP date on its own big line. */
export function formatDateShort(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Formats a Date as HH:mm — used to print the EXP time on its own big line. */
export function formatTimeShort(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Midnight (00:00) of the given date's day, in local time. */
export function startOfToday(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}
