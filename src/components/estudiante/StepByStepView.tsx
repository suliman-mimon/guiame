"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import StudentSidebar from "@/components/estudiante/StudentSidebar";

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

const FORMATS: { id: Format; label: string; icon: string }[] = [
  { id: "pictograma", label: "Pictograma", icon: "▧" },
  { id: "video", label: "Vídeo", icon: "▶" },
  { id: "audio", label: "Audio", icon: "◖" },
  { id: "literal", label: "Descripción literal", icon: "Aa" },
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
      <div className="flex min-h-56 w-full items-center justify-center rounded-[28px] bg-[#f2ede2] p-5">
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
            <p className="text-center text-lg font-semibold text-[#66716c]">
              No hay un pictograma para este paso.
            </p>
          )}
      </div>
      <figcaption className="text-center text-xs text-[#66716c]">
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
    <div className="flex aspect-video w-full max-w-[520px] flex-col items-center justify-center rounded-2xl bg-[#1e2928] px-6 text-center text-white">
      <span
        aria-hidden="true"
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-[#20615b]"
      >
        ▶
      </span>
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
        <div className="flex items-center gap-4 rounded-2xl border-2 border-[#e4e0d7] bg-[#fffefb] p-4">
        <button
          aria-label={isSpeaking ? "Detener audio" : "Escuchar instrucción"}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#20615b] text-2xl text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb]"
          onClick={toggleSpeech}
          type="button"
        >
          {isSpeaking ? "■" : "◖"}
        </button>
        <div aria-hidden="true" className="flex h-12 flex-1 items-center gap-1">
          {[18, 30, 40, 24, 35, 44, 26, 36, 20, 32, 16, 25].map(
            (height, index) => (
              <span
                className={`w-1.5 rounded-full ${
                  isSpeaking && index < 6 ? "bg-[#20615b]" : "bg-[#c7bead]"
                }`}
                key={`${height}-${index}`}
                style={{ height }}
              />
            ),
          )}
        </div>
        <span className="shrink-0 text-sm font-bold text-[#343b38]">
          {isSpeaking ? "Reproduciendo" : "Audio"}
        </span>
        </div>
      )}
      <p className="mt-3 text-center text-sm text-[#66716c]">
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
    isAuthenticated
      ? { realizacionId: realizationId, numeroPaso: stepNumber }
      : "skip",
  );
  const advanceMutation = useMutation(api.realizaciones.avanzarPaso);
  const finishMutation = useMutation(api.realizaciones.terminar);
  const [format, setFormat] = useState<Format>("pictograma");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const step: ActivityStep | null = detail
    ? {
        title: detail.paso.texto,
        description: detail.descripcion ?? "",
        pictogram:
          detail.paso.imagen === null
            ? null
            : {
                url: detail.paso.imagen.ubicacionArchivo,
                arasaacId: detail.paso.imagen.arasaacId,
                alt: detail.paso.imagen.textoAlternativo,
              },
        initialFormat: detail.paso.tipoMedio,
        videoUrl:
          detail.paso.tipoMedio === "video" ? detail.paso.archivoUrl : null,
        audioUrl:
          detail.paso.tipoMedio === "audio" ? detail.paso.archivoUrl : null,
      }
    : null;
  const totalSteps = detail?.totalPasos ?? 0;
  const currentStep = detail?.pasoActual ?? 1;
  const activityTitle = detail?.titulo ?? "";
  const schedule = detail
    ? `De ${formatTime(detail.inicioProgramado)} a ${formatTime(detail.finProgramado)}`
    : "";
  const activityHref = realizationId;
  const stepHref = (number: number) =>
    `/estudiante/actividad/${activityHref}/paso/${number}`;
  const previousStepHref = stepHref(stepNumber - 1);
  const nextStepHref = stepHref(stepNumber + 1);
  const isCurrentStep = stepNumber === currentStep;
  const isLoading =
    isAuthLoading ||
    (isAuthenticated && detail === undefined);

  useEffect(() => {
    if (step) setFormat(step.initialFormat);
  }, [stepNumber, step?.initialFormat]);

  async function finishActivity() {
    if (!realizationId || !isCurrentStep || stepNumber !== totalSteps) {
      setActionError("Completa los pasos en orden antes de terminar.");
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
    if (!isCurrentStep) {
      router.push(stepHref(currentStep));
      return;
    }
    if (stepNumber === totalSteps) {
      await finishActivity();
      return;
    }
    setIsSaving(true);
    setActionError(null);
    try {
      await advanceMutation({
        realizacionId: realizationId,
        numeroPaso: stepNumber,
      });
      router.push(nextStepHref);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <p className="flex h-dvh items-center justify-center text-xl text-[#66716c]" role="status">
        Cargando el paso…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="flex h-dvh items-center justify-center text-xl text-[#66716c]" role="alert">
        Inicia sesión con una cuenta de estudiante para ver este paso.
      </p>
    );
  }

  if (!step || detail === null) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-[#fbfaf7] px-6 text-center">
        <p className="text-xl font-semibold text-[#242a27]" role="alert">
          Este paso no está disponible o todavía no te corresponde.
        </p>
        <Link
          className="rounded-xl bg-[#20615b] px-6 py-3 font-bold text-white"
          href="/hoy"
        >
          Volver a hoy
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#fbfaf7]">
      <StudentSidebar />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border-2 border-[#e4e0d7] bg-[#fffefb] px-3 text-sm font-bold text-[#242a27] hover:border-[#20615b] focus:outline-none focus:ring-4 focus:ring-[#c8dedb] sm:px-5 sm:text-base"
            href="/hoy"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
            Volver a hoy
          </Link>

          <div className="text-center">
            <h1 className="text-lg font-extrabold leading-tight text-[#242a27] sm:text-2xl">
              {activityTitle}
            </h1>
            <p className="text-sm text-[#66716c] sm:text-base">
              {schedule}
            </p>
          </div>

          <span className="justify-self-end rounded-xl bg-[#fff1cc] px-3 py-3 text-sm font-extrabold text-[#785500] sm:px-5 sm:text-base">
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
                index < stepNumber ? "bg-[#20615b]" : "bg-[#ded7c9]"
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
              <div className="w-full max-w-[520px] rounded-3xl border-2 border-[#e4e0d7] bg-[#fffefb] p-6 sm:p-8">
                <p className="text-sm font-bold uppercase tracking-wide text-[#66716c]">
                  Instrucción
                </p>
                <p className="mt-4 text-2xl font-semibold leading-relaxed text-[#242a27] sm:text-3xl">
                  {step.title}. {step.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col justify-center">
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#242a27] sm:text-4xl lg:text-[42px]">
              {step.title}
            </h2>
            {step.description && (
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#66645f] sm:text-xl">
                {step.description}
              </p>
            )}
          </div>
        </section>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#e4e0d7] pt-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#77736c]">
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
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] sm:min-h-14 sm:px-4 sm:text-base ${
                      isSelected
                        ? "border-[#f2b640] bg-[#f2b640] text-[#242a27]"
                        : "border-[#20615b] bg-[#fffefb] text-[#20615b] hover:bg-[#e7f0ee]"
                    }`}
                    key={item.id}
                    onClick={() => setFormat(item.id)}
                    type="button"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                    {isSelected && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 sm:gap-3">
            {stepNumber > 1 && isCurrentStep && (
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#20615b] bg-[#fffefb] px-4 text-sm font-bold text-[#20615b] hover:bg-[#e7f0ee] focus:outline-none focus:ring-4 focus:ring-[#c8dedb] sm:min-h-14 sm:px-6 sm:text-base"
                href={previousStepHref}
              >
                <span aria-hidden="true">‹</span>
                Anterior
              </Link>
            )}
            <button
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] sm:min-h-14 sm:px-8 sm:text-base ${
                stepNumber === totalSteps
                  ? "bg-[#f2b640] text-[#242a27] hover:bg-[#e6a923]"
                  : "bg-[#20615b] text-white hover:bg-[#184d48]"
              }`}
              disabled={isSaving}
              onClick={continueActivity}
              type="button"
            >
              {isSaving
                ? "Guardando…"
                : !isCurrentStep
                  ? "Ir al paso actual"
                  : stepNumber === totalSteps
                    ? "Termino"
                    : "Siguiente"}
              <span aria-hidden="true">
                {isCurrentStep && stepNumber === totalSteps ? "✓" : "→"}
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
    </div>
  );
}
