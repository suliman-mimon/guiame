"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

type Format = "pictograma" | "video" | "audio" | "literal";

type ActivityStep = {
  title: string;
  description: string;
  pictogram: {
    url: string;
    arasaacId: string | null;
    alt: string;
  } | null;
  initialFormat: Format;
  videoUrl: string | null;
  audioUrl: string | null;
};

const FORMATS: { id: Format; label: string }[] = [
  { id: "pictograma", label: "Pictograma" },
  { id: "video", label: "Vídeo" },
  { id: "audio", label: "Audio" },
  { id: "literal", label: "Descripción literal" },
];

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

function Pictogram({
  pictogram,
}: {
  pictogram: ActivityStep["pictogram"];
}) {
  return (
    <figure className="flex h-full min-h-56 w-full max-w-[360px] flex-col items-center justify-center gap-3">
      <div className="flex min-h-56 w-full items-center justify-center rounded-[28px] bg-alumno-lateral p-5">
          {pictogram ? (
            <Image
              alt={pictogram.alt}
              className="h-auto max-h-[280px] w-full max-w-[280px] object-contain"
              height={500}
              loading="eager"
              src={pictogram.url}
              unoptimized={!pictogram.arasaacId}
              width={500}
            />
          ) : (
            <p className="text-center text-lg font-semibold text-alumno-texto-suave">
              No se pudo cargar el pictograma de este paso.
            </p>
          )}
      </div>
      <figcaption className="text-center text-xs text-alumno-texto-suave">
        Pictogramas de Sergio Palao,{" "}
        <a
          className="underline underline-offset-2"
          href="https://arasaac.org/terms-of-use"
          rel="noreferrer"
          target="_blank"
        >
          ARASAAC (Gobierno de Aragón)
        </a>
        {" · "}CC BY-NC-SA
      </figcaption>
    </figure>
  );
}

function VideoPlaceholder({ src }: { src: string | null }) {
  if (src) {
    return (
      <video
        aria-label="Vídeo con la instrucción del paso"
        className="aspect-video w-full max-w-[520px] rounded-2xl bg-black"
        controls
        src={src}
      >
        Este navegador no puede reproducir el vídeo.
      </video>
    );
  }

  return (
    <div className="flex aspect-video w-full max-w-[520px] flex-col items-center justify-center rounded-2xl bg-alumno-primario-hover px-6 text-center text-white">
      <Image
        alt="Pictograma de vídeo"
        className="mb-4 h-16 w-16 rounded-full bg-white object-contain p-2"
        height={64}
        src="https://static.arasaac.org/pictograms/38207/38207_500.png"
        width={64}
      />
      <p className="text-lg font-bold">Vídeo no disponible</p>
      <p className="mt-2 text-sm text-white/75">
        Aún no se ha añadido un vídeo para este paso.
      </p>
    </div>
  );
}

function AudioPlayer({ text, src }: { text: string; src: string | null }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function toggleSpeech() {
    if (src) return;
    if (!("speechSynthesis" in window)) {
      setAudioError("La reproducción de audio no está disponible en este navegador.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setAudioError(null);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAudioError("No se pudo reproducir el audio.");
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="w-full max-w-[440px]">
      {src ? (
        <audio
          aria-label="Audio con la instrucción del paso"
          className="w-full"
          controls
          src={src}
        >
          Este navegador no puede reproducir el audio.
        </audio>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border-2 border-alumno-borde bg-alumno-superficie p-4">
        <button
          aria-label={isSpeaking ? "Detener audio" : "Escuchar instrucción"}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-alumno-primario px-2 text-center text-sm font-bold text-white transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
          onClick={toggleSpeech}
          type="button"
        >
          {isSpeaking ? "Detener" : "Escuchar"}
        </button>
        <div aria-hidden="true" className="flex h-12 flex-1 items-center gap-1">
          {[18, 30, 40, 24, 35, 44, 26, 36, 20, 32, 16, 25].map(
            (height, index) => (
              <span
                className={`w-1.5 rounded-full ${
                  isSpeaking && index < 6
                    ? "bg-alumno-primario"
                    : "bg-alumno-borde"
                }`}
                key={`${height}-${index}`}
                style={{ height }}
              />
            ),
          )}
        </div>
        <span className="shrink-0 text-sm font-bold text-alumno-texto-secundario">
          {isSpeaking ? "Reproduciendo" : "Audio"}
        </span>
        </div>
      )}
      <p className="mt-3 text-center text-sm text-alumno-texto-suave">
        {src
          ? "Escucha el audio de este paso."
          : isSpeaking
            ? "Escucha la instrucción."
            : "Pulsa el altavoz para escuchar."}
      </p>
      {!src && audioError && (
        <p className="mt-2 text-center text-sm font-semibold text-[#9b2c2c]" role="alert">
          {audioError}
        </p>
      )}
    </div>
  );
}

export default function StepByStepView({
  stepNumber,
  realizationId,
}: {
  stepNumber: number;
  realizationId: Id<"realizaciones">;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const detail = useQuery(
    api.realizaciones.obtenerDetalle,
    isAuthenticated ? { realizacionId: realizationId } : "skip",
  );
  const orderedSteps = useMemo(
    () => [...(detail?.pasos ?? [])].sort((a, b) => a.orden - b.orden),
    [detail?.pasos],
  );
  const selectedStep = orderedSteps[stepNumber - 1];
  const mediaFileId =
    selectedStep?.tipoMedio === "video" || selectedStep?.tipoMedio === "audio"
      ? selectedStep.archivoId
      : undefined;
  const mediaUrl = useQuery(
    api.actividades.obtenerUrlArchivo,
    isAuthenticated && mediaFileId !== undefined
      ? { archivoId: mediaFileId }
      : "skip",
  );
  const finishMutation = useMutation(api.realizaciones.terminar);
  const [format, setFormat] = useState<Format>("pictograma");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const step: ActivityStep | null = detail && selectedStep
    ? {
        title: selectedStep.texto,
        description: detail.descripcion ?? "",
        pictogram: null,
        initialFormat: selectedStep.tipoMedio,
        videoUrl:
          selectedStep.tipoMedio === "video" ? (mediaUrl ?? null) : null,
        audioUrl:
          selectedStep.tipoMedio === "audio" ? (mediaUrl ?? null) : null,
      }
    : null;
  const totalSteps = orderedSteps.length;
  const activityTitle = detail?.titulo ?? "";
  const schedule = detail
    ? `De ${formatTime(detail.fInicioProgramada)} a ${formatTime(detail.fFinProgramada)}`
    : "";
  const activityHref = realizationId;
  const stepHref = (number: number) =>
    `/hoy/actividad/${activityHref}/paso/${number}`;
  const previousStepHref = stepHref(stepNumber - 1);
  const nextStepHref = stepHref(stepNumber + 1);
  const isLoading =
    isAuthLoading ||
    (isAuthenticated && detail === undefined) ||
    (isAuthenticated && mediaFileId !== undefined && mediaUrl === undefined);

  useEffect(() => {
    if (step) setFormat(step.initialFormat);
  }, [stepNumber, step?.initialFormat]);

  async function finishActivity() {
    if (stepNumber !== totalSteps) {
      setActionError("Completa todos los pasos antes de terminar.");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      await finishMutation({ realizacionId: realizationId });
      router.push(`/hoy?completed=${realizationId}`);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function continueActivity() {
    if (stepNumber === totalSteps) {
      await finishActivity();
      return;
    }
    router.push(nextStepHref);
  }

  if (isLoading) {
    return (
      <p className="flex h-dvh items-center justify-center text-xl text-alumno-texto-suave" role="status">
        Cargando el paso…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="flex h-dvh items-center justify-center text-xl text-alumno-texto-suave" role="alert">
        Inicia sesión con una cuenta de estudiante para ver este paso.
      </p>
    );
  }

  if (!step || detail === null) {
    const unavailableMessage =
      detail === null
        ? "Esta actividad no está disponible."
        : totalSteps === 0
          ? "Esta actividad todavía no tiene pasos disponibles."
          : "Este paso no existe o no está disponible.";
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-alumno-fondo px-6 text-center">
        <p className="text-xl font-semibold text-alumno-texto" role="alert">
          {unavailableMessage}
        </p>
        <Link
          className="rounded-xl bg-alumno-primario px-6 py-3 font-bold text-white"
          href="/hoy"
        >
          Volver a hoy
        </Link>
      </div>
    );
  }

  return (
      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-alumno-fondo px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border-2 border-alumno-borde bg-alumno-superficie px-3 text-sm font-bold text-alumno-texto hover:border-alumno-primario focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 sm:px-5 sm:text-base"
            href="/hoy"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
            Volver a hoy
          </Link>

          <div className="text-center">
            <h1 className="text-lg font-extrabold leading-tight text-alumno-texto sm:text-2xl">
              {activityTitle}
            </h1>
            <p className="text-sm text-alumno-texto-suave sm:text-base">
              {schedule}
            </p>
          </div>

          <span className="justify-self-end rounded-xl bg-alumno-acento/20 px-3 py-3 text-sm font-extrabold text-[#785500] sm:px-5 sm:text-base">
            Paso {stepNumber} de {totalSteps}
          </span>
        </header>

        <div
          aria-label={`Progreso: paso ${stepNumber} de ${totalSteps}`}
          className="mt-4 grid shrink-0 gap-2"
          style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={stepNumber}
        >
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              aria-hidden="true"
              className={`h-2.5 rounded-full ${
                index < stepNumber ? "bg-alumno-primario" : "bg-alumno-borde"
              }`}
              key={index}
            />
          ))}
        </div>

        <section
          aria-label={`Paso ${stepNumber}: ${step.title}`}
          className="grid min-h-0 flex-1 grid-cols-1 items-center gap-5 overflow-hidden py-4 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:gap-12"
        >
          <div className="flex min-h-0 items-center justify-center">
            {format === "pictograma" && (
              <Pictogram pictogram={step.pictogram} />
            )}
            {format === "video" && <VideoPlaceholder src={step.videoUrl} />}
            {format === "audio" && (
              <AudioPlayer
                src={step.audioUrl}
                text={`${step.title}. ${step.description}`}
              />
            )}
            {format === "literal" && (
              <div className="w-full max-w-[520px] rounded-3xl border-2 border-alumno-borde bg-alumno-superficie p-6 sm:p-8">
                <p className="text-sm font-bold uppercase tracking-wide text-alumno-texto-suave">
                  Instrucción
                </p>
                <p className="mt-4 text-2xl font-semibold leading-relaxed text-alumno-texto sm:text-3xl">
                  {step.title}. {step.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col justify-center">
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-alumno-texto sm:text-4xl lg:text-[42px]">
              {step.title}
            </h2>
            {step.description && (
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-alumno-texto-suave sm:text-xl">
                {step.description}
              </p>
            )}
          </div>
        </section>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-alumno-borde pt-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-alumno-texto-apagado">
              Cambiar formato
            </p>
            <div
              aria-label="Formato de la tarea"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="group"
            >
              {FORMATS.map((item) => {
                const isSelected = format === item.id;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 sm:min-h-14 sm:px-4 sm:text-base ${
                      isSelected
                        ? "border-alumno-acento bg-alumno-acento text-alumno-texto"
                        : "border-alumno-primario bg-alumno-superficie text-alumno-primario hover:bg-alumno-superficie-hecha"
                    }`}
                    key={item.id}
                    onClick={() => setFormat(item.id)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {isSelected && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 sm:gap-3">
            {stepNumber > 1 && (
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-alumno-primario bg-alumno-superficie px-4 text-sm font-bold text-alumno-primario hover:bg-alumno-superficie-hecha focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 sm:min-h-14 sm:px-6 sm:text-base"
                href={previousStepHref}
              >
                <span aria-hidden="true">‹</span>
                Anterior
              </Link>
            )}
            <button
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/20 sm:min-h-14 sm:px-8 sm:text-base ${
                stepNumber === totalSteps
                  ? "bg-alumno-acento text-alumno-texto hover:bg-alumno-acento/90"
                  : "bg-alumno-primario text-white hover:bg-alumno-primario-hover"
              }`}
              disabled={isSaving}
              onClick={continueActivity}
              type="button"
            >
              {isSaving
                ? "Guardando…"
                : stepNumber === totalSteps
                  ? "Termino"
                  : "Siguiente"}
              <span aria-hidden="true">
                {stepNumber === totalSteps ? "✓" : "→"}
              </span>
            </button>
          </div>
          {actionError && (
            <p className="text-sm font-semibold text-[#9b2c2c]" role="alert">
              {actionError}
            </p>
          )}
        </footer>
      </main>
  );
}
