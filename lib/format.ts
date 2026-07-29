function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Formats a Date as dd/mm/yyyy HH:mm for label text and previews. */
export function formatDateTime(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/** Converts a Date to the value expected by <input type="datetime-local">. */
export function toDatetimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Parses the value of an <input type="datetime-local"> back into a Date. */
export function fromDatetimeLocalValue(value: string): Date {
  return new Date(value);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
