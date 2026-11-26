"use client";

import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import CelebrationOverlay from "@/components/estudiante/CelebrationOverlay";
import { usePictogramas } from "@/components/estudiante/pictogramas";
import { useTema } from "@/components/TemaProvider";

type Period = "morning" | "afternoon";

type Activity = {
  id: Id<"realizaciones">;
  startTime: string;
  title: string;
  completionText: string;
  status: "pending" | "in_progress" | "completed";
  imagenId: Id<"imagenes">;
};

type Celebration = {
  completionText: string;
  next: Activity | null;
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

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`La fecha no es válida: ${fecha}`);
  }
  const formatted = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return `${formatted.charAt(0).toLocaleUpperCase("es-ES")}${formatted.slice(1)}`;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar el cambio.";
}

export default function AgendaHoy({
  fechaInicial,
  completedId,
}: {
  fechaInicial: string;
  completedId: string | null;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const [fecha, setFecha] = useState(fechaInicial);
  const { inicio, fin } = useMemo(() => {
    const inicio = inicioDiaMadrid(fecha);
    const fechaSiguiente = cambiarDia(fecha, 1);
    return { inicio, fin: inicioDiaMadrid(fechaSiguiente) };
  }, [fecha]);
  const agenda = useQuery(
    api.realizaciones.miAgenda,
    isAuthenticated ? { inicio, fin } : "skip",
  );
  const startMutation = useMutation(api.realizaciones.empezar);
  // Por la tarde se abre directamente la tarde.
  const [period, setPeriod] = useState<Period>(() =>
    formatTime(Date.now()) >= "14:00" ? "afternoon" : "morning",
  );
  const tema = useTema();
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const serverActivities = useMemo<Activity[]>(
    () =>
      (agenda ?? []).map((activity) => ({
        id: activity.realizacionId,
        startTime: formatTime(activity.fInicioProgramada),
        title: activity.titulo,
        completionText: `la actividad «${activity.titulo}»`,
        imagenId: activity.imagenId,
        status:
          activity.hFinReal !== undefined
            ? "completed"
            : activity.hInicioReal !== undefined
              ? "in_progress"
              : "pending",
      })),
    [agenda],
  );
  const activities = serverActivities;
  const orderedActivities = useMemo(
    () => [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities],
  );
  const hasActivityInProgress = orderedActivities.some(
    (activity) => activity.status === "in_progress",
  );
  const nextActivityId = hasActivityInProgress
    ? undefined
    : orderedActivities.find((activity) => activity.status === "pending")?.id;
  const visibleActivities = orderedActivities.filter((activity) =>
    period === "morning"
      ? activity.startTime < "14:00"
      : activity.startTime >= "14:00",
  );
  const pictogramas = usePictogramas(orderedActivities.map((a) => a.imagenId));

  useEffect(() => {
    if (
      completedId === null ||
      isAuthLoading ||
      agenda === undefined
    ) {
      return;
    }

    const completedActivity = activities.find(
      (activity) => activity.id === completedId,
    );
    if (completedActivity?.status !== "completed") return;

    const completedIndex = orderedActivities.findIndex(
      (activity) => activity.id === completedActivity.id,
    );
    const nextActivity =
      orderedActivities
        .slice(completedIndex + 1)
        .find((activity) => activity.status === "pending") ?? null;

    setCelebration({
      completionText: completedActivity.completionText,
      next: nextActivity,
    });
    router.replace("/hoy");
  }, [
    activities,
    agenda,
    completedId,
    isAuthLoading,
    orderedActivities,
    router,
  ]);

  async function startActivity(id: Id<"realizaciones">) {
    const currentActivity = activities.find(
      (activity) => activity.status === "in_progress",
    );
    const nextActivity = orderedActivities.find(
      (activity) => activity.status === "pending",
    );

    if (currentActivity || nextActivity?.id !== id) {
      return;
    }

    const activity = orderedActivities.find((item) => item.id === id);
    if (activity === undefined) return;

    setPendingId(id);
    setActionError(null);
    try {
      await startMutation({ realizacionId: id });
      router.push(`/hoy/actividad/${id}/paso/1`);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  if (
    isAuthLoading ||
    (isAuthenticated && agenda === undefined)
  ) {
    return (
      <p className="flex-1 py-6 text-center text-lg text-alumno-texto-suave" role="status">
        Cargando las actividades…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="flex-1 py-6 text-center text-lg text-alumno-texto-suave" role="alert">
        Inicia sesión con una cuenta de estudiante para ver tus actividades.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <button
          aria-label="Ver el día anterior"
          className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-alumno-borde bg-alumno-superficie text-alumno-primario transition hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={() => setFecha((current) => cambiarDia(current, -1))}
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
        <p aria-live="polite" className="text-center text-lg font-bold text-alumno-texto">
          {formatDate(fecha)}
        </p>
        <button
          aria-label="Ver el día siguiente"
          className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-alumno-borde bg-alumno-superficie text-alumno-primario transition hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={() => setFecha((current) => cambiarDia(current, 1))}
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
      </div>
      {actionError && (
        <p
          className="mb-2 shrink-0 rounded-xl bg-alerta-suave px-4 py-2 text-center font-semibold text-alerta"
          role="alert"
        >
          {actionError}
        </p>
      )}
      <ul
        aria-label={
          period === "morning"
            ? "Actividades de la mañana"
            : "Actividades de la tarde"
        }
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-2"
      >
        {visibleActivities.length === 0 && (
          <li className="rounded-2xl border-2 border-alumno-borde bg-alumno-superficie px-5 py-8 text-center text-lg text-alumno-texto-suave">
            No tienes actividades asignadas para este periodo.
          </li>
        )}
        {visibleActivities.map((activity) => {
          const isCurrent = activity.status === "in_progress";
          const isNext =
            activity.status === "pending" && activity.id === nextActivityId;
          const isDone = activity.status === "completed";
          const pictograma = pictogramas.get(activity.imagenId);

          return (
            <li
              className={`relative flex min-h-[88px] shrink-0 items-center gap-4 rounded-2xl border-2 bg-alumno-superficie px-4 sm:gap-5 sm:px-5 ${
                isCurrent
                  ? "border-alumno-primario"
                  : isNext
                    ? "border-alumno-primario/50"
                    : "border-alumno-borde"
              }`}
              key={activity.id}
            >
              {tema.mostrarPictograma && (
                pictograma ? (
                  <img
                    alt=""
                    className={`h-14 w-14 shrink-0 rounded-xl bg-white object-contain p-1 ${
                      isDone ? "opacity-60 grayscale" : ""
                    }`}
                    height={56}
                    src={pictograma.url}
                    width={56}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-14 w-14 shrink-0 rounded-xl bg-alumno-superficie-hecha"
                  />
                )
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-lg font-bold sm:text-xl ${
                    isDone ? "text-alumno-texto-apagado" : "text-alumno-texto"
                  } ${tema.mostrarTexto ? "" : "sr-only"}`}
                >
                  {activity.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-alumno-texto-apagado sm:text-base">
                    {activity.startTime}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-alumno-acento px-2.5 py-0.5 text-xs font-bold text-alumno-texto">
                      En curso
                    </span>
                  )}
                  {isNext && (
                    <span className="text-sm font-bold text-alumno-texto">
                      Siguiente
                    </span>
                  )}
                </div>
              </div>
              {isDone && (
                <span className="flex shrink-0 items-center gap-2 text-lg font-bold text-alumno-primario sm:text-xl">
                  <span aria-hidden="true" className="text-2xl">
                    ✓
                  </span>
                  Hecho
                </span>
              )}
              {isCurrent && (
                <button
                  aria-label={`Continuar ${activity.title}, paso 1`}
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-alumno-primario px-5 text-lg font-bold text-alumno-sobre-primario transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
                  onClick={() =>
                    router.push(
                      `/hoy/actividad/${activity.id}/paso/1`,
                    )
                  }
                  type="button"
                >
                  Continuar <span aria-hidden="true">→</span>
                </button>
              )}
              {isNext && (
                <button
                  aria-label={`Empezar ${activity.title}`}
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-alumno-primario px-5 text-lg font-bold text-alumno-sobre-primario transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pendingId === activity.id}
                  onClick={() => startActivity(activity.id)}
                  type="button"
                >
                  {pendingId === activity.id ? "Guardando…" : "Empiezo"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <footer
        className="flex shrink-0 flex-col gap-3 pt-4 sm:flex-row sm:items-end sm:justify-end"
      >
        <div
          aria-label="Cambiar entre mañana y tarde"
          className="flex rounded-full bg-alumno-lateral p-1.5"
          role="group"
        >
          <button
            aria-pressed={period === "morning"}
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 ${
              period === "morning"
                ? "bg-alumno-primario text-alumno-sobre-primario"
                : "text-alumno-texto-secundario hover:bg-alumno-lateral"
            }`}
            onClick={() => setPeriod("morning")}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              ☀
            </span>
            Ver la mañana
          </button>
          <button
            aria-pressed={period === "afternoon"}
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 ${
              period === "afternoon"
                ? "bg-alumno-primario text-alumno-sobre-primario"
                : "text-alumno-texto-secundario hover:bg-alumno-lateral"
            }`}
            onClick={() => setPeriod("afternoon")}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              ☾
            </span>
            Ver la tarde
          </button>
        </div>
      </footer>
      {celebration && (
        <CelebrationOverlay
          completionText={celebration.completionText}
          next={celebration.next}
          pictogramaSiguiente={
            celebration.next ? pictogramas.get(celebration.next.imagenId) : undefined
          }
          onStartNext={() => {
            if (!celebration.next) return;
            setPeriod(
              celebration.next.startTime < "14:00" ? "morning" : "afternoon",
            );
            startActivity(celebration.next.id);
            setCelebration(null);
          }}
          onDismiss={() => {
            setCelebration(null);
            router.replace("/hoy");
          }}
        />
      )}
    </div>
  );
}
