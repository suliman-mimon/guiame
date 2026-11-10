"use client";

import { Star, Sun } from "lucide-react";

export default function CelebrationOverlay({
  studentName,
  completedTitle,
  next,
  onDismiss,
}: {
  studentName: string;
  completedTitle: string;
  next: { title: string; startTime: string } | null;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-guiame-cream/95 px-6 text-center backdrop-blur-sm">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
        <Star className="h-14 w-14 fill-amber-400 text-amber-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">
        ¡Muy bien, {studentName}!
      </h1>
      <p className="text-lg text-gray-600">Has terminado {completedTitle}.</p>

      {next && (
        <div className="mt-4 w-full max-w-sm text-left">
          <p className="mb-2 text-sm font-semibold text-gray-500">Lo siguiente</p>
          <div className="flex items-center justify-between rounded-2xl border border-guiame-teal bg-white px-5 py-4">
            <div>
              <p className="font-semibold text-gray-900">{next.title}</p>
              <p className="text-sm text-gray-500">{next.startTime}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Siguiente
            </span>
          </div>
        </div>
      )}

      <button
        onClick={onDismiss}
        className="mt-6 flex items-center gap-2 rounded-xl bg-guiame-teal px-6 py-3 font-semibold text-white transition hover:bg-guiame-teal-dark"
      >
        <Sun className="h-5 w-5" /> Volver a hoy
      </button>
    </div>
  );
}
