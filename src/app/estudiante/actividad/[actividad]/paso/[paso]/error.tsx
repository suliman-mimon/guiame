"use client";

import Link from "next/link";

export default function StepError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xl font-semibold text-[#242a27]" role="alert">
        No se pudo cargar la actividad. Puede que ya no esté asignada o que el
        paso no esté disponible.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className="rounded-xl border-2 border-[#20615b] px-5 py-3 font-bold text-[#20615b]"
          onClick={reset}
          type="button"
        >
          Reintentar
        </button>
        <Link
          className="rounded-xl bg-[#20615b] px-5 py-3 font-bold text-white"
          href="/hoy"
        >
          Volver a hoy
        </Link>
      </div>
    </div>
  );
}
