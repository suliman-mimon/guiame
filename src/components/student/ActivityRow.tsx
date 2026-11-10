"use client";

import { Check, Play } from "lucide-react";

export type TodayActivity = {
  assignmentId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "pending" | "in_progress" | "completed";
  pictogramLabel: string;
  pictogramImageUrl: string;
};

export default function ActivityRow({
  activity,
  isNext,
  onStart,
  onComplete,
}: {
  activity: TodayActivity;
  isNext: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const isDone = activity.status === "completed";
  const isCurrent = activity.status === "in_progress";
  const isUpNext = activity.status === "pending" && isNext;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
        isCurrent
          ? "border-guiame-teal bg-white"
          : isUpNext
            ? "border-guiame-teal/40 bg-white"
            : "border-transparent bg-white/70"
      }`}
    >
      <div className="flex items-center gap-4">
        <img
          src={activity.pictogramImageUrl}
          alt={activity.pictogramLabel}
          className="h-12 w-12 shrink-0 rounded-xl bg-gray-100 object-contain p-1"
        />
        <div>
          <div className="flex items-center gap-2">
            <p
              className={`text-lg font-semibold ${isDone ? "text-gray-400" : "text-gray-900"}`}
            >
              {activity.title}
            </p>
            {isCurrent && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Ahora
              </span>
            )}
            {isUpNext && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Siguiente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {activity.startTime}
            {isCurrent && " · En curso"}
          </p>
        </div>
      </div>

      {isDone && (
        <span className="flex shrink-0 items-center gap-1 font-semibold text-guiame-teal">
          <Check className="h-5 w-5" /> Hecho
        </span>
      )}
      {isCurrent && onComplete && (
        <button
          onClick={onComplete}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-white transition hover:bg-amber-500"
        >
          Termino <Check className="h-4 w-4" />
        </button>
      )}
      {isUpNext && onStart && (
        <button
          onClick={onStart}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-guiame-teal px-4 py-2 font-semibold text-white transition hover:bg-guiame-teal-dark"
        >
          <Play className="h-4 w-4" /> Empiezo
        </button>
      )}
    </div>
  );
}
