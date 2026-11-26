"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import CelebrationOverlay from "@/components/estudiante/CelebrationOverlay";

type Period = "morning" | "afternoon";

type Activity = {
  id: Id<"realizaciones">;
  startTime: string;
  title: string;
  completionText: string;
  image: ActivityImage | null;
  stepCount: number;
  currentStep: number;
  status: "pending" | "in_progress" | "completed";
};

type ActivityImage = {
  ubicacionArchivo: string;
  textoAlternativo: string;
  arasaacId: string | null;
};

type Celebration = {
  completionText: string;
  next: Activity | null;
};

function areMorningActivitiesComplete(activities: Activity[]) {
  const morningActivities = activities.filter(
    (activity) => activity.startTime < "14:00",
  );
  return (
    morningActivities.every((activity) => activity.status === "completed")
  );
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
  fecha,
  completedId,
}: {
  fecha: string;
  completedId: string | null;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const agenda = useQuery(
    api.realizaciones.miAgenda,
    isAuthenticated ? { fecha } : "skip",
  );
  const startMutation = useMutation(api.realizaciones.empezar);
  const finishMutation = useMutation(api.realizaciones.terminar);
  const [period, setPeriod] = useState<Period>("morning");
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const serverActivities = useMemo<Activity[]>(
    () =>
      (agenda ?? []).map((activity) => ({
        id: activity.realizacionId,
        startTime: formatTime(activity.inicioProgramado),
        title: activity.titulo,
        completionText: `la actividad «${activity.titulo}»`,
        image: activity.imagen,
        stepCount: activity.numeroPasos,
        currentStep: activity.pasoActual ?? 1,
        status:
          activity.finReal !== null
            ? "completed"
            : activity.inicioReal !== null
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
  const morningActivitiesComplete =
    areMorningActivitiesComplete(orderedActivities);
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

    if (
      currentActivity ||
      nextActivity?.id !== id ||
      (nextActivity.startTime >= "14:00" && !morningActivitiesComplete)
    ) {
      return;
    }

    const activity = orderedActivities.find((item) => item.id === id);
    if (activity === undefined) return;

    setPendingId(id);
    setActionError(null);
    try {
      await startMutation({ realizacionId: id });
      if (activity.stepCount > 0) {
        router.push(
          `/estudiante/actividad/${id}/paso/${activity.currentStep}`,
        );
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  async function completeActivity(id: Id<"realizaciones">) {
    const activityIndex = orderedActivities.findIndex(
      (activity) => activity.id === id,
    );
    const activity = orderedActivities[activityIndex];
    const nextUncompletedActivity = orderedActivities.find(
      (candidate) => candidate.status !== "completed",
    );

    if (
      !activity ||
      nextUncompletedActivity?.id !== id ||
      activity.status !== "in_progress" ||
      (activity.startTime >= "14:00" && !morningActivitiesComplete)
    ) {
      return;
    }

    const nextActivity =
      orderedActivities
        .slice(activityIndex + 1)
        .find((candidate) => candidate.status === "pending") ?? null;

    if (activity.stepCount > 0) return;
    setPendingId(id);
    setActionError(null);
    try {
      await finishMutation({ realizacionId: id });
      setCelebration({
        completionText: activity.completionText,
        next: nextActivity,
      });
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
      <p className="flex-1 py-6 text-center text-lg text-[#66716c]" role="status">
        Cargando las actividades…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="flex-1 py-6 text-center text-lg text-[#66716c]" role="alert">
        Inicia sesión con una cuenta de estudiante para ver tus actividades.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {period === "afternoon" && !morningActivitiesComplete && (
        <p
          className="mb-2 shrink-0 rounded-xl bg-[#f2b640] px-4 py-2 text-center font-bold text-[#242a27]"
          id="afternoon-locked-message"
          role="status"
        >
          Completa primero todas las actividades de la mañana.
        </p>
      )}
      {actionError && (
        <p
          className="mb-2 shrink-0 rounded-xl bg-[#fbeee7] px-4 py-2 text-center font-semibold text-[#9b2c2c]"
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
          <li className="rounded-2xl border-2 border-[#e4e0d7] bg-[#fffefb] px-5 py-8 text-center text-lg text-[#66716c]">
            No tienes actividades asignadas para este periodo.
          </li>
        )}
        {visibleActivities.map((activity) => {
          const isCurrent = activity.status === "in_progress";
          const isNext =
            activity.status === "pending" && activity.id === nextActivityId;
          const isDone = activity.status === "completed";
          const isAfternoonLocked =
            activity.startTime >= "14:00" && !morningActivitiesComplete;

          return (
            <li
              className={`relative flex min-h-[88px] shrink-0 items-center gap-4 rounded-2xl border-2 bg-[#fffefb] px-4 sm:gap-5 sm:px-5 ${
                isCurrent
                  ? "border-[#20615b]"
                  : isNext
                    ? "border-[#20615b]/50"
                    : "border-[#e4e0d7]"
              }`}
              key={activity.id}
            >
              {activity.image ? (
                <Image
                  src={activity.image.ubicacionArchivo}
                  alt={activity.image.textoAlternativo}
                  width={56}
                  height={56}
                  unoptimized={!activity.image.arasaacId}
                  className={`h-14 w-14 shrink-0 rounded-xl bg-[#f4f0e7] object-contain p-1 ${
                    isDone ? "grayscale" : ""
                  }`}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${
                    isDone ? "bg-[#f1eee7] grayscale" : "bg-[#f4f0e7]"
                  }`}
                  aria-label="Pictograma no disponible"
                  role="img"
                >
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-lg font-bold sm:text-xl ${
                    isDone ? "text-[#77736c]" : "text-[#242a27]"
                  }`}
                >
                  {activity.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-[#77736c] sm:text-base">
                    {activity.startTime}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-[#f2b640] px-2.5 py-0.5 text-xs font-bold text-[#242a27]">
                      En curso
                    </span>
                  )}
                  {isNext && (
                    <span className="text-sm font-bold text-[#785500]">
                      Siguiente
                    </span>
                  )}
                </div>
              </div>
              {isDone && (
                <span className="flex shrink-0 items-center gap-2 text-lg font-bold text-[#20615b] sm:text-xl">
                  <span aria-hidden="true" className="text-2xl">
                    ✓
                  </span>
                  Hecho
                </span>
              )}
              {isCurrent && activity.stepCount === 0 && (
                <button
                  aria-label={`Terminar ${activity.title}`}
                  aria-describedby={
                    isAfternoonLocked ? "afternoon-locked-message" : undefined
                  }
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-[#f2b640] px-5 text-lg font-bold text-[#242a27] transition hover:bg-[#e6a923] focus:outline-none focus:ring-4 focus:ring-[#f4dfa8] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isAfternoonLocked || pendingId === activity.id}
                  onClick={() => completeActivity(activity.id)}
                  type="button"
                >
                  {pendingId === activity.id ? "Guardando…" : "Termino"}{" "}
                  <span aria-hidden="true">✓</span>
                </button>
              )}
              {isCurrent && activity.stepCount > 0 && (
                <button
                  aria-label={`Continuar ${activity.title}, paso ${activity.currentStep}`}
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-[#20615b] px-5 text-lg font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb]"
                  onClick={() => router.push(
                    `/estudiante/actividad/${activity.id}/paso/${activity.currentStep}`,
                  )}
                  type="button"
                >
                  Continuar <span aria-hidden="true">→</span>
                </button>
              )}
              {isNext && (
                <button
                  aria-label={`Empezar ${activity.title}`}
                  aria-describedby={
                    isAfternoonLocked ? "afternoon-locked-message" : undefined
                  }
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-[#20615b] px-5 text-lg font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isAfternoonLocked || pendingId === activity.id}
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
          className="flex rounded-full bg-[#e9e3d6] p-1.5"
          role="group"
        >
          <button
            aria-pressed={period === "morning"}
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] ${
              period === "morning"
                ? "bg-[#20615b] text-white"
                : "text-[#343b38] hover:bg-[#ddd6c9]"
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
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] ${
              period === "afternoon"
                ? "bg-[#20615b] text-white"
                : "text-[#343b38] hover:bg-[#ddd6c9]"
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
