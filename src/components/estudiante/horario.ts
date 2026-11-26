import { epochEnMadrid, sumarDias } from "@/components/panel/fechas";

const formatoHora = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const formatoFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const horaEnMadrid = (instante: number) => formatoHora.format(instante);

export function fechaHoraTareaEnMadrid(
  fecha: string,
  hora: string,
): number | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  ) {
    return null;
  }
  const estimado = epochEnMadrid(fecha, hora);
  if (!Number.isFinite(estimado)) return null;

  // En el cambio de otoño una hora local puede ocurrir dos veces.
  const opciones = [estimado - 3600000, estimado, estimado + 3600000].filter(
    (instante) =>
      formatoFecha.format(instante) === fecha &&
      horaEnMadrid(instante) === hora,
  );
  return opciones.length === 1 ? opciones[0] : null;
}

export function rangoDiaMadrid(fecha: string) {
  return {
    inicio: epochEnMadrid(fecha, "00:00"),
    fin: epochEnMadrid(sumarDias(fecha, 1), "00:00"),
  };
}

export function urlPictograma(id: string) {
  return `https://api.arasaac.org/v1/pictograms/${id}?download=false`;
}
