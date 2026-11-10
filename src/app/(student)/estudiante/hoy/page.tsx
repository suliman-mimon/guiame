"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { ChevronRight, Smile, Star } from "lucide-react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { todayDateString, formatLongDate, sortKeyMinutes } from "@/lib/dates";
import { MOOD_LABEL } from "@/lib/moods";
import ActivityRow, { type TodayActivity } from "@/components/student/ActivityRow";
import CelebrationOverlay from "@/components/student/CelebrationOverlay";

export default function HoyPage() {
  const date = useMemo(() => todayDateString(), []);
  const user = useQuery(api.users.currentUser, {});
  const activities = useQuery(api.activities.myToday, { date });
  const mood = useQuery(api.moods.getTodayForStudent, { date });
  const markStarted = useMutation(api.activities.markStarted);
  const markCompleted = useMutation(api.activities.markCompleted);

  const [celebration, setCelebration] = useState<{
    title: string;
    next: { title: string; startTime: string } | null;
  } | null>(null);

  if (user === undefined || activities === undefined || user === null) {
    return <main className="p-8 text-gray-500">Cargando…</main>;
  }

  const displayName = user.role === "student" ? user.displayName : "";

  const sorted = [...activities].sort(
    (a, b) => sortKeyMinutes(a.startTime) - sortKeyMinutes(b.startTime),
  );
  const nextPendingId =
    sorted.find((a) => a.status === "pending")?.assignmentId ?? null;
  const morning = sorted.filter((a) => sortKeyMinutes(a.startTime) < 14 * 60);
  const afternoon = sorted.filter((a) => sortKeyMinutes(a.startTime) >= 14 * 60);
  const completedCount = sorted.filter((a) => a.status === "completed").length;

  async function handleStart(assignmentId: Id<"activityAssignments">) {
    await markStarted({ assignmentId });
  }

  async function handleComplete(activity: TodayActivity) {
    await markCompleted({ assignmentId: activity.assignmentId as Id<"activityAssignments"> });
    const idx = sorted.findIndex((a) => a.assignmentId === activity.assignmentId);
    const next = sorted[idx + 1] ?? null;
    setCelebration({
      title: activity.title,
      next: next ? { title: next.title, startTime: next.startTime } : null,
    });
  }

  return (
    <main className="flex gap-6 p-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Buenos días, {displayName}!
        </h1>
        <p className="mt-1 text-gray-500">{formatLongDate(new Date())}</p>

        {morning.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-bold text-gray-800">Mañana</h2>
            <div className="space-y-3">
              {morning.map((activity) => (
                <ActivityRow
                  key={activity.assignmentId}
                  activity={activity}
                  isNext={activity.assignmentId === nextPendingId}
                  onStart={() => handleStart(activity.assignmentId as Id<"activityAssignments">)}
                  onComplete={() => handleComplete(activity)}
                />
              ))}
            </div>
          </section>
        )}

        {afternoon.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-bold text-gray-800">Tarde</h2>
            <div className="space-y-3">
              {afternoon.map((activity) => (
                <ActivityRow
                  key={activity.assignmentId}
                  activity={activity}
                  isNext={activity.assignmentId === nextPendingId}
                  onStart={() => handleStart(activity.assignmentId as Id<"activityAssignments">)}
                  onComplete={() => handleComplete(activity)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="w-72 shrink-0 space-y-4">
        <Link
          href="/estudiante/animo"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:shadow"
        >
          <span className="flex items-center gap-2 font-semibold text-gray-800">
            <Smile className="h-5 w-5 text-guiame-teal" />
            {mood === undefined
              ? "…"
              : mood === null
                ? "¿Cómo te sientes hoy?"
                : `Hoy dijiste: ${MOOD_LABEL[mood.mood]}`}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        {completedCount > 0 && (
          <div className="flex items-start gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <Star className="mt-0.5 h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
            <p className="font-semibold text-gray-800">
              ¡Muy bien! Ya hiciste {completedCount}{" "}
              {completedCount === 1 ? "actividad" : "actividades"}
            </p>
          </div>
        )}
      </aside>

      {celebration && (
        <CelebrationOverlay
          studentName={displayName}
          completedTitle={celebration.title}
          next={celebration.next}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </main>
  );
}
