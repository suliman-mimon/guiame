// Fechas del panel siempre en hora de Madrid, que es donde está el centro.

const ZONA = "Europe/Madrid";

/** Hoy en Madrid como "YYYY-MM-DD". */
export function hoyEnMadrid(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return partes; // en-CA da ya el formato YYYY-MM-DD
}

/** Hora actual en Madrid en minutos desde las 00:00. */
export function minutosAhoraEnMadrid(): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .split(":")
    .map(Number);
  return h * 60 + m;
}

/** Suma días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "Lunes, 23 de noviembre" para una fecha "YYYY-MM-DD". */
export function fechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "HH:MM" a minutos desde las 00:00. */
export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** "09:05" → "9:05", como en los bocetos. */
export function horaCorta(hora: string): string {
  return hora.replace(/^0/, "");
}

/**
 * Día "YYYY-MM-DD" y hora "HH:MM" de Madrid a milisegundos desde 1970, que es
 * como guarda el esquema v2 `fInicioProgramada` y `fFinProgramada`. Tiene en
 * cuenta el horario de verano (UTC+2) y el de invierno (UTC+1).
 */
export function epochEnMadrid(fecha: string, hora: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const comoSiFueraUtc = Date.UTC(anio, mes - 1, dia, h, m);
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(comoSiFueraUtc));
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value);
  const enMadrid = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
  );
  return comoSiFueraUtc - (enMadrid - comoSiFueraUtc);
}

/** Las actividades de tarde empiezan a partir de las 14:00 (como en la app del alumno). */
export const INICIO_TARDE = 14 * 60;
