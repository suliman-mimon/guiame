"use client";

import { useEffect, useRef } from "react";

type CelebrationOverlayProps = {
  completionText: string;
  next: {
    id: string;
    title: string;
    startTime: string;
  } | null;
  /** Pictograma de la siguiente actividad (si ya ha llegado). */
  pictogramaSiguiente?: { url: string; alt: string } | undefined;
  onDismiss: () => void;
  onStartNext: () => void;
};

export default function CelebrationOverlay({
  completionText,
  next,
  pictogramaSiguiente,
  onDismiss,
  onStartNext,
}: CelebrationOverlayProps) {
  const startNextButtonRef = useRef<HTMLButtonElement>(null);
  const returnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    returnButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      } else if (event.key === "Tab") {
        const focusableButtons = [
          startNextButtonRef.current,
          returnButtonRef.current,
        ].filter((button): button is HTMLButtonElement => button !== null);
        const currentIndex = focusableButtons.findIndex(
          (button) => button === document.activeElement,
        );
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex =
          currentIndex === -1
            ? direction === 1
              ? 0
              : focusableButtons.length - 1
            : (currentIndex + direction + focusableButtons.length) %
              focusableButtons.length;

        event.preventDefault();
        focusableButtons[nextIndex]?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-alumno-fondo px-8 py-6">
      <section
        aria-describedby="celebration-description"
        aria-labelledby="celebration-title"
        aria-modal="true"
        className="w-full max-w-[600px] text-center"
        role="dialog"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-alumno-acento/20"
        >
          <svg
            className="h-20 w-20"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m12 2.5 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.06l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.5Z"
              fill="var(--alumno-acento)"
              stroke="var(--alumno-acento)"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </div>

        <h2
          className="mt-5 text-4xl font-bold tracking-tight text-alumno-texto sm:text-5xl"
          id="celebration-title"
        >
          ¡Muy bien!
        </h2>
        <p
          className="mt-4 text-xl leading-8 text-alumno-texto-secundario sm:text-2xl"
          id="celebration-description"
        >
          Has terminado {completionText}.
        </p>

        {next ? (
          <div className="mt-7 text-left">
            <p className="mb-2 text-lg font-bold text-alumno-texto-suave">
              Lo siguiente
            </p>
            <div className="flex items-center gap-4 rounded-2xl border-2 border-alumno-primario bg-alumno-superficie p-3">
              {pictogramaSiguiente ? (
                <img
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl bg-white object-contain p-1"
                  height={56}
                  src={pictogramaSiguiente.url}
                  width={56}
                />
              ) : (
                <span aria-hidden="true" className="h-14 w-14 shrink-0 rounded-xl bg-alumno-superficie-hecha" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-alumno-texto sm:text-xl">
                    {next.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-alumno-acento px-2.5 py-0.5 text-sm font-bold text-alumno-texto">
                    Siguiente
                  </span>
                </div>
                <p className="mt-1 text-alumno-texto-suave">{next.startTime}</p>
              </div>
              <button
                className="flex min-h-14 shrink-0 items-center gap-2 rounded-xl bg-alumno-primario px-4 text-lg font-bold text-alumno-sobre-primario transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 sm:px-5"
                onClick={onStartNext}
                ref={startNextButtonRef}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 16 16"
                >
                  <path d="M4 2.5a.75.75 0 0 1 1.14-.64l8 5a.75.75 0 0 1 0 1.28l-8 5A.75.75 0 0 1 4 12.5z" />
                </svg>
                Empiezo
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-xl font-semibold text-alumno-primario">
            ¡Has completado todas tus actividades de hoy!
          </p>
        )}

        <button
          className="mt-6 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-alumno-primario px-8 text-xl font-bold text-alumno-sobre-primario transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={onDismiss}
          ref={returnButtonRef}
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
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
          Volver a hoy
        </button>
      </section>
    </div>
  );
}
