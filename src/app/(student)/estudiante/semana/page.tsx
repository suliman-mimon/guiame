"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "convex/_generated/api";
import { MONTHS, WEEKDAY_SHORT, addDays, mondayOf, todayDateString, ymd } from "@/lib/dates";

export default function SemanaPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const todayStr = todayDateString();
  const weekEnd = addDays(weekStart, 6);
  const startDate = ymd(weekStart);
  const endDate = ymd(weekEnd);

  const activities = useQuery(api.activities.myWeek, { startDate, endDate });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `Del ${weekStart.getDate()} al ${weekEnd.getDate()} de ${MONTHS[weekEnd.getMonth()]}`
      : `Del ${weekStart.getDate()} de ${MONTHS[weekStart.getMonth()]} al ${weekEnd.getDate()} de ${MONTHS[weekEnd.getMonth()]}`;

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="rounded-full border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Esta semana</h1>
          <p className="text-gray-500">{rangeLabel}</p>
        </div>
        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="rounded-full border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-500">Toca un día para verlo entero.</p>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {days.map((d) => {
          const dateStr = ymd(d);
          const isToday = dateStr === todayStr;
          const dayActivities = (activities ?? [])
            .filter((a) => a.date === dateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={dateStr}
              className={`rounded-2xl border p-3 ${
                isToday ? "border-guiame-teal bg-white" : "border-gray-200 bg-white/60"
              }`}
            >
              <div className="mb-2 text-center">
                {isToday ? (
                  <>
                    <p className="font-bold text-guiame-teal">Hoy</p>
                    <p className="text-xs text-gray-400">
                      {WEEKDAY_SHORT[d.getDay()]} {d.getDate()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-800">{WEEKDAY_SHORT[d.getDay()]}</p>
                    <p className="text-xs text-gray-400">{d.getDate()}</p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {activities === undefined ? (
                  <p className="text-center text-xs text-gray-400">…</p>
                ) : dayActivities.length === 0 ? (
                  <p className="text-center text-xs text-gray-400">Sin actividades</p>
                ) : (
                  dayActivities.map((a) => (
                    <div
                      key={a.assignmentId}
                      className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1.5"
                    >
                      <img
                        src={a.pictogramImageUrl}
                        alt={a.pictogramLabel}
                        className="h-6 w-6 shrink-0 object-contain"
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {a.startTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
