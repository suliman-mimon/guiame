import AgendaHoy from "@/components/estudiante/AgendaHoy";

type HoyPageProps = {
  searchParams: Promise<{ completed?: string | string[] }>;
};

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

export default async function HoyPage({ searchParams }: HoyPageProps) {
  const { completed } = await searchParams;
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
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-alumno-fondo px-8 py-6">
      <header className="mb-5 flex shrink-0 items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-alumno-texto">
            Hoy
          </h1>
        </div>
      </header>

      <AgendaHoy
        fechaInicial={fechaInicial}
        completedId={typeof completed === "string" ? completed : null}
      />
    </main>
  );
}
