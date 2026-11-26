import Link from "next/link";
import AgendaHoy from "@/components/estudiante/AgendaHoy";

type HoyPageProps = {
  searchParams: Promise<{ completed?: string | string[] }>;
};

const fechaHoraMadrid = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

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

function inicioDiaMadrid(year: number, month: number, day: number) {
  const utcMidnight = Date.UTC(year, month - 1, day);
  const parts = fechaHoraMadrid.formatToParts(new Date(utcMidnight));
  const localAsUtc = Date.UTC(
    parteNumerica(parts, "year"),
    parteNumerica(parts, "month") - 1,
    parteNumerica(parts, "day"),
    parteNumerica(parts, "hour"),
    parteNumerica(parts, "minute"),
    parteNumerica(parts, "second"),
  );
  return utcMidnight - (localAsUtc - utcMidnight);
}

export default async function HoyPage({ searchParams }: HoyPageProps) {
  const { completed } = await searchParams;
  const ahora = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(ahora);
  const dateParts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Madrid",
  }).formatToParts(ahora);
  const year = parteNumerica(dateParts, "year");
  const month = parteNumerica(dateParts, "month");
  const day = parteNumerica(dateParts, "day");
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const inicio = inicioDiaMadrid(year, month, day);
  const fin = inicioDiaMadrid(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
  );
  const today = `${formattedDate.charAt(0).toLocaleUpperCase("es-ES")}${formattedDate
    .slice(1)
    .replace(",", "")}`;

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-alumno-fondo px-8 py-6">
      <header className="mb-5 flex shrink-0 items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-alumno-texto">
            Hoy
          </h1>
          <p className="mt-1 text-lg text-alumno-texto-suave">{today}</p>
        </div>
        <Link
          className="flex min-h-[76px] w-[270px] shrink-0 items-center justify-between gap-4 rounded-2xl border-2 border-alumno-borde bg-alumno-superficie px-5 text-lg font-bold leading-tight text-alumno-texto transition hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          href="/estudiante/animo"
        >
          <span aria-hidden="true" className="text-3xl text-alumno-primario">
            ☺
          </span>
          <span>¿Cómo te sientes hoy?</span>
          <span aria-hidden="true" className="text-3xl text-alumno-primario">
            ›
          </span>
        </Link>
      </header>

      <AgendaHoy
        inicio={inicio}
        fin={fin}
        completedId={typeof completed === "string" ? completed : null}
      />
    </main>
  );
}
