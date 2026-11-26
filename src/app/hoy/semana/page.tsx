import AgendaSemana from "@/components/estudiante/AgendaSemana";

function parteNumerica(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) {
    throw new Error(`No se pudo calcular la fecha local (${type})`);
  }
  return Number(value);
}

export default function SemanaPage() {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Madrid",
  }).formatToParts(new Date());
  const year = parteNumerica(dateParts, "year");
  const month = parteNumerica(dateParts, "month");
  const day = parteNumerica(dateParts, "day");
  const fechaInicial = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-alumno-fondo px-6 py-6 sm:px-8">
      <AgendaSemana fechaInicial={fechaInicial} />
    </main>
  );
}