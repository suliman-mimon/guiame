export const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayDateString(): string {
  return ymd(new Date());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

export function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = addDays(d, diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function formatLongDate(d: Date): string {
  const weekday = WEEKDAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized} ${d.getDate()} de ${month}`;
}

// A school day never starts before 5am, so a stored "HH:MM" earlier than
// that is a same-session activity whose offset wrapped past midnight.
// Treat it as very late instead of very early so sorting stays correct.
export function sortKeyMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const minutes = h * 60 + m;
  return minutes < 5 * 60 ? minutes + 24 * 60 : minutes;
}
