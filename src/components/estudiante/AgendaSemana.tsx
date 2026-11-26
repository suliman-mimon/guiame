"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

type WeekActivity = {
  id: Id<"realizaciones">;
  dayKey: string;
  startTimeSort: string;
  startTimeLabel: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
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

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

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

function inicioDiaMadrid(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error(`La fecha no es válida: ${fecha}`);
  }

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

function cambiarDia(fecha: string, dias: number) {
  const [year, month, day] = fecha.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`La fecha no es válida: ${fecha}`);
  }
  return new Date(Date.UTC(year, month - 1, day + dias))
    .toISOString()
    .slice(0, 10);
}

function obtenerLunesSemana(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`La fecha no es válida: ${fecha}`);
  }
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return cambiarDia(fecha, offsetToMonday);
}

function fechaClaveMadrid(timestamp: number) {
  const parts = fechaHoraMadrid.formatToParts(new Date(timestamp));
  const year = parteNumerica(parts, "year");
  const month = parteNumerica(parts, "month");
  const day = parteNumerica(parts, "day");
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTime(timestamp: number) {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
  return {
    sort: formatted,
    label: formatted.startsWith("0") ? formatted.slice(1) : formatted,
  };
}

function getDayMeta(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`La fecha no es válida: ${fecha}`);
  }
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const shortWeekday = DIAS_CORTOS[date.getUTCDay()] ?? "";
  const fullLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return {
    shortWeekday,
    dayNumber: day,
    fullLabel,
  };
}

function formatWeekRange(lunes: string, domingo: string) {
  const [y1, m1, d1] = lunes.split("-").map(Number);
  const [y2, m2, d2] = domingo.split("-").map(Number);
  if (
    y1 === undefined ||
    m1 === undefined ||
    d1 === undefined ||
    y2 === undefined ||
    m2 === undefined ||
    d2 === undefined
  ) {
    return `${lunes} – ${domingo}`;
  }

  const monthFmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    month: "long",
  });
  const monthStart = monthFmt.format(new Date(Date.UTC(y1, m1 - 1, d1, 12)));
  const monthEnd = monthFmt.format(new Date(Date.UTC(y2, m2 - 1, d2, 12)));

  if (m1 === m2 && y1 === y2) {
    return `Del ${d1} al ${d2} de ${monthEnd}`;
  }
  return `Del ${d1} de ${monthStart} al ${d2} de ${monthEnd}`;
}

function ActivityIcon({ completed }: { completed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {completed ? (
        <path d="M20 6 9 17l-5-5" />
      ) : (
        <>
          <rect height="14" rx="2" width="16" x="4" y="5" />
          <path d="M8 10h8M8 14h5" />
        </>
      )}
    </svg>
  );
}

export default function AgendaSemana({
  fechaInicial,
}: {
  fechaInicial: string;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  
  const [lunes, setLunes] = useState(() => obtenerLunesSemana(fechaInicial));

  const config = useQuery(
    api.configuracionesVisuales.miConfiguracion,
    isAuthenticated ? {} : "skip",
  );
  const vistaHabilitada = config?.permiteVerSemana ?? true;

  const { inicio, fin, diasSemana } = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, index) =>
      cambiarDia(lunes, index),
    );
    return {
      inicio: inicioDiaMadrid(lunes),
      fin: inicioDiaMadrid(cambiarDia(lunes, 7)),
      diasSemana: dias,
    };
  }, [lunes]);

  const agenda = useQuery(
    api.realizaciones.miAgenda,
    isAuthenticated && config !== undefined && vistaHabilitada
      ? { inicio, fin }
      : "skip",
  );

  useEffect(() => {
    if (config !== undefined && config !== null && !config.permiteVerSemana) {
      router.replace("/hoy");
    }
  }, [config, router]);

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, WeekActivity[]>();
    for (const day of diasSemana) {
      map.set(day, []);
    }
    for (const item of agenda ?? []) {
      const dayKey = fechaClaveMadrid(item.fInicioProgramada);
      const list = map.get(dayKey);
      if (!list) continue;
      const time = formatTime(item.fInicioProgramada);
      list.push({
        id: item.realizacionId,
        dayKey,
        startTimeSort: time.sort,
        startTimeLabel: time.label,
        title: item.titulo,
        status:
          item.hFinReal !== undefined
            ? "completed"
            : item.hInicioReal !== undefined
              ? "in_progress"
              : "pending",
      });
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTimeSort.localeCompare(b.startTimeSort));
    }
    return map;
  }, [agenda, diasSemana]);

  if (
    isAuthLoading ||
    (isAuthenticated && config === undefined) ||
    (isAuthenticated && vistaHabilitada && agenda === undefined)
  ) {
    return (
      <p
        className="flex flex-1 items-center justify-center text-lg text-alumno-texto-suave"
        role="status"
      >
        Cargando tu semana…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p
        className="flex flex-1 items-center justify-center text-lg text-alumno-texto-suave"
        role="alert"
      >
        Inicia sesión con una cuenta de estudiante para ver tu semana.
      </p>
    );
  }

  if (!vistaHabilitada) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold text-alumno-texto" role="status">
          La vista semanal no está activada en tu configuración.
        </p>
        <Link
          className="rounded-xl bg-alumno-primario px-6 py-3 font-bold text-white transition hover:bg-alumno-primario-hover"
          href="/hoy"
        >
          Volver a Hoy
        </Link>
      </div>
    );
  }

  const domingo = diasSemana[6] ?? cambiarDia(lunes, 6);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <button
          aria-label="Ver la semana anterior"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-alumno-borde bg-alumno-superficie text-alumno-texto transition hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={() => setLunes((current) => cambiarDia(current, -7))}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-alumno-texto sm:text-4xl">
            Mi semana
          </h1>
          <p
            aria-live="polite"
            className="mt-1 text-base font-medium text-alumno-texto-suave"
          >
            {formatWeekRange(lunes, domingo)}
          </p>
        </div>

        <button
          aria-label="Ver la semana siguiente"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-alumno-borde bg-alumno-superficie text-alumno-texto transition hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={() => setLunes((current) => cambiarDia(current, 7))}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </header>

      <p className="mb-3 shrink-0 text-sm font-medium text-alumno-texto-suave sm:text-base">
        Toca un día para verlo entero.
      </p>

      <div className="min-h-0 flex-1 overflow-x-auto pb-1">
        <ul
          aria-label="Días de la semana"
          className="grid h-full min-w-[780px] grid-cols-7 gap-2.5"
        >
          {diasSemana.map((day) => {
            const { shortWeekday, dayNumber, fullLabel } = getDayMeta(day);
            const isToday = day === fechaInicial;
            const dayActivities = activitiesByDay.get(day) ?? [];

            return (
              <li className="flex min-h-0" key={day}>
                <Link
                  aria-label={`Ver ${isToday ? "hoy, " : ""}${fullLabel}, ${
                    dayActivities.length === 0
                      ? "sin actividades"
                      : `${dayActivities.length} ${
                          dayActivities.length === 1
                            ? "actividad"
                            : "actividades"
                        }`
                  }`}
                  className={`flex min-h-0 w-full flex-col rounded-2xl border-2 p-2.5 transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 ${
                    isToday
                      ? "border-alumno-primario bg-alumno-primario/10"
                      : "border-alumno-borde bg-alumno-superficie hover:border-alumno-primario/60"
                  }`}
                  href={`/hoy?fecha=${day}`}
                >
                  <div className="mb-3 shrink-0 pt-1 text-center">
                    <p
                      className={`text-base font-extrabold leading-tight ${
                        isToday ? "text-alumno-primario" : "text-alumno-texto"
                      }`}
                    >
                      {isToday ? "Hoy" : shortWeekday}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-alumno-texto-suave">
                      {isToday ? `${shortWeekday} ${dayNumber}` : dayNumber}
                    </p>
                  </div>

                  {dayActivities.length === 0 ? (
                    <p className="mt-2 px-1 text-center text-sm font-medium leading-snug text-alumno-texto-apagado">
                      Sin actividades
                    </p>
                  ) : (
                    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                      {dayActivities.map((activity) => {
                        const isDone = activity.status === "completed";
                        return (
                          <li
                            className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
                              isToday
                                ? "bg-alumno-superficie"
                                : "bg-alumno-fondo"
                            } ${isDone ? "opacity-65" : ""}`}
                            key={activity.id}
                            title={activity.title}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                isDone
                                  ? "bg-alumno-primario/15 text-alumno-primario"
                                  : "bg-alumno-superficie-hecha text-alumno-texto"
                              }`}
                            >
                              <ActivityIcon completed={isDone} />
                            </span>
                            <span className="truncate text-sm font-extrabold text-alumno-texto">
                              {activity.startTimeLabel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}