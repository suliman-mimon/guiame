"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type CelebrationOverlayProps = {
  completionText: string;
  next: {
    id: string;
    title: string;
    startTime: string;
    image: {
      ubicacionArchivo: string;
      textoAlternativo: string;
      arasaacId: string | null;
    } | null;
  } | null;
  onDismiss: () => void;
  onStartNext: () => void;
};

export default function CelebrationOverlay({
  completionText,
  next,
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
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#f7f3eb] px-8 py-6">
      <section
        aria-describedby="celebration-description"
        aria-labelledby="celebration-title"
        aria-modal="true"
        className="w-full max-w-[600px] text-center"
        role="dialog"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[#fff1cc]"
        >
          <svg
            className="h-20 w-20"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m12 2.5 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.06l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.5Z"
              fill="#f2b640"
              stroke="#b8791d"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </div>

        <h2
          className="mt-5 text-4xl font-bold tracking-tight text-[#242a27] sm:text-5xl"
          id="celebration-title"
        >
          ¡Muy bien!
        </h2>
        <p
          className="mt-4 text-xl leading-8 text-[#343b38] sm:text-2xl"
          id="celebration-description"
        >
          Has terminado {completionText}.
        </p>

        {next ? (
          <div className="mt-7 text-left">
            <p className="mb-2 text-lg font-bold text-[#66645f]">
              Lo siguiente
            </p>
            <div className="flex items-center gap-4 rounded-2xl border-2 border-[#20615b] bg-[#fffefb] p-3">
              {next.image ? (
                <Image
                  src={next.image.ubicacionArchivo}
                  alt={next.image.textoAlternativo}
                  width={56}
                  height={56}
                  unoptimized={!next.image.arasaacId}
                  className="h-14 w-14 shrink-0 rounded-xl bg-[#f4f0e7] object-contain p-1"
                />
              ) : (
                <span
                  aria-label="Pictograma no disponible"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f4f0e7] text-xs font-medium text-[#66716c]"
                  role="img"
                >
                  Sin imagen
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-[#242a27] sm:text-xl">
                    {next.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-[#f2b640] px-2.5 py-0.5 text-sm font-bold text-[#242a27]">
                    Siguiente
                  </span>
                </div>
                <p className="mt-1 text-[#66645f]">{next.startTime}</p>
              </div>
              <button
                className="flex min-h-14 shrink-0 items-center gap-2 rounded-xl bg-[#20615b] px-4 text-lg font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb] sm:px-5"
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
          <p className="mt-6 text-xl font-semibold text-[#20615b]">
            ¡Has completado todas tus actividades de hoy!
          </p>
        )}

        <button
          className="mt-6 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-[#20615b] px-8 text-xl font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb]"
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
