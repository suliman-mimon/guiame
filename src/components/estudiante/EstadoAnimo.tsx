"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "convex/_generated/api";

type EmocionKey =
  | "feliz"
  | "triste"
  | "enfadado"
  | "sorprendido"
  | "asustado"
  | "tranquilo";

type EmocionConfig = {
  key: EmocionKey;
  label: string;
  orden: number;
  bgClass: string;
  selectedBgClass: string;
  borderClass: string;
  selectedBorderClass: string;
  badgeClass: string;
};

// Catálogo alineado con convex/seed.ts (orden 0..5).
// "basico" muestra las 3 primeras por orden; "ampliado" muestra las 6.
// Colores pasteles con texto #111827 (contraste > 11:1, WCAG AAA).
const CATALOGO_EMOCIONES: readonly EmocionConfig[] = [
  {
    key: "feliz",
    label: "Feliz",
    orden: 0,
    bgClass: "bg-[#FEF3C7]",
    selectedBgClass: "bg-[#FDE68A]",
    borderClass: "border-[#D97706]/40",
    selectedBorderClass: "border-[#B45309]",
    badgeClass: "bg-[#B45309] text-white",
  },
  {
    key: "triste",
    label: "Triste",
    orden: 1,
    bgClass: "bg-[#DBEAFE]",
    selectedBgClass: "bg-[#BFDBFE]",
    borderClass: "border-[#2563EB]/40",
    selectedBorderClass: "border-[#1D4ED8]",
    badgeClass: "bg-[#1D4ED8] text-white",
  },
  {
    key: "enfadado",
    label: "Enfadado",
    orden: 2,
    bgClass: "bg-[#FEE2E2]",
    selectedBgClass: "bg-[#FECACA]",
    borderClass: "border-[#DC2626]/40",
    selectedBorderClass: "border-[#B91C1C]",
    badgeClass: "bg-[#B91C1C] text-white",
  },
  {
    key: "sorprendido",
    label: "Sorprendido",
    orden: 3,
    bgClass: "bg-[#FFEDD5]",
    selectedBgClass: "bg-[#FED7AA]",
    borderClass: "border-[#EA580C]/40",
    selectedBorderClass: "border-[#C2410C]",
    badgeClass: "bg-[#C2410C] text-white",
  },
  {
    key: "asustado",
    label: "Asustado",
    orden: 4,
    bgClass: "bg-[#F3E8FF]",
    selectedBgClass: "bg-[#E9D5FF]",
    borderClass: "border-[#9333EA]/40",
    selectedBorderClass: "border-[#7E22CE]",
    badgeClass: "bg-[#7E22CE] text-white",
  },
  {
    key: "tranquilo",
    label: "Tranquilo",
    orden: 5,
    bgClass: "bg-[#DCFCE7]",
    selectedBgClass: "bg-[#BBF7D0]",
    borderClass: "border-[#16A34A]/40",
    selectedBorderClass: "border-[#15803D]",
    badgeClass: "bg-[#15803D] text-white",
  },
];

function EmocionIcon({ emocion }: { emocion: EmocionKey }) {
  return (
    <svg
      aria-hidden="true"
      className="h-14 w-14 shrink-0 text-[#111827]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9.5" />
      {emocion === "feliz" && (
        <>
          <circle cx="9" cy="10" fill="currentColor" r="1" />
          <circle cx="15" cy="10" fill="currentColor" r="1" />
          <path d="M8.5 14.5c1 1.6 2.2 2.3 3.5 2.3s2.5-.7 3.5-2.3" />
        </>
      )}
      {emocion === "triste" && (
        <>
          <circle cx="9" cy="10" fill="currentColor" r="1" />
          <circle cx="15" cy="10" fill="currentColor" r="1" />
          <path d="M8.5 16.5c1-1.5 2.2-2.2 3.5-2.2s2.5.7 3.5 2.2" />
        </>
      )}
      {emocion === "enfadado" && (
        <>
          <path d="M7.5 8.5 10.5 10M16.5 8.5 13.5 10" />
          <circle cx="9" cy="11.5" fill="currentColor" r="0.9" />
          <circle cx="15" cy="11.5" fill="currentColor" r="0.9" />
          <path d="M8.5 16.5c1-1.3 2.2-1.8 3.5-1.8s2.5.5 3.5 1.8" />
        </>
      )}
      {emocion === "sorprendido" && (
        <>
          <circle cx="9" cy="9.5" fill="currentColor" r="1" />
          <circle cx="15" cy="9.5" fill="currentColor" r="1" />
          <circle cx="12" cy="15.2" r="2" />
        </>
      )}
      {emocion === "asustado" && (
        <>
          <circle cx="9" cy="9.5" fill="currentColor" r="1.1" />
          <circle cx="15" cy="9.5" fill="currentColor" r="1.1" />
          <path d="M8.5 15.8c.8-.9 1.6-.9 2.3 0 .7.9 1.7.9 2.4 0 .7-.9 1.5-.9 2.3 0" />
        </>
      )}
      {emocion === "tranquilo" && (
        <>
          <path d="M7.8 10.5c.6-.8 1.8-.8 2.4 0M13.8 10.5c.6-.8 1.8-.8 2.4 0" />
          <path d="M9.5 15c.8.8 1.7 1.2 2.5 1.2s1.7-.4 2.5-1.2" />
        </>
      )}
    </svg>
  );
}

export default function EstadoAnimo({ fechaHoy }: { fechaHoy: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const [seleccionada, setSeleccionada] = useState<EmocionKey | null>(null);
  const [guardadaHoy, setGuardadaHoy] = useState<EmocionKey | null>(null);

  const config = useQuery(
    api.configuracionesVisuales.miConfiguracion,
    isAuthenticated ? {} : "skip",
  );
  const vistaHabilitada = config?.permiteDecirComoSeSiente ?? true;
  const rango = config?.rangoEmociones ?? "basico";

  useEffect(() => {
    if (
      config !== undefined &&
      config !== null &&
      !config.permiteDecirComoSeSiente
    ) {
      router.replace("/hoy");
    }
  }, [config, router]);

  if (isAuthLoading || (isAuthenticated && config === undefined)) {
    return (
      <p
        className="flex flex-1 items-center justify-center text-lg text-alumno-texto-suave"
        role="status"
      >
        Cargando…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p
        className="flex flex-1 items-center justify-center text-lg text-alumno-texto-suave"
        role="alert"
      >
        Inicia sesión con una cuenta de estudiante para registrar cómo te
        sientes.
      </p>
    );
  }

  if (!vistaHabilitada) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold text-alumno-texto" role="status">
          Esta pantalla no está activada en tu configuración.
        </p>
        <Link
          className="rounded-xl bg-alumno-primario px-6 py-3 font-bold text-white transition hover:bg-alumno-primario-hover"
          href="/hoy"
        >
          Volver a Hoy
        </Link>
      </div>
    );
  }

  const emocionesVisibles =
    rango === "ampliado" ? CATALOGO_EMOCIONES : CATALOGO_EMOCIONES.slice(0, 3);

  const emocionActiva = seleccionada ?? guardadaHoy;
  const hayCambioSinGuardar =
    seleccionada !== null && seleccionada !== guardadaHoy;
  const emocionGuardadaMeta =
    guardadaHoy !== null
      ? (CATALOGO_EMOCIONES.find((item) => item.key === guardadaHoy) ?? null)
      : null;

  function handleGuardar() {
    if (seleccionada === null || seleccionada === guardadaHoy) return;
    // TODO(GM-48): sustituir por la mutation de Convex para estadosEmocionales
    // enviando { fechaRegistro: fechaHoy, emocionId }.
    setGuardadaHoy(seleccionada);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-alumno-texto sm:text-4xl">
          Mi estado de ánimo
        </h1>
        <p className="mt-1.5 text-base font-medium text-alumno-texto-suave">
          ¿Cómo te sientes ahora? Elige una cara. Puedes cambiarla siempre que
          quieras.
        </p>
      </header>

      <div
        aria-label="Opciones de estado de ánimo"
        className={`grid flex-1 content-start gap-4 ${
          emocionesVisibles.length <= 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
        data-fecha={fechaHoy}
        role="group"
      >
        {emocionesVisibles.map((item) => {
          const isSelected = emocionActiva === item.key;

          return (
            <button
              aria-pressed={isSelected}
              className={`relative flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition focus:outline-none focus:ring-4 focus:ring-alumno-primario/30 ${
                isSelected
                  ? `border-4 ${item.selectedBorderClass} ${item.selectedBgClass} shadow-md`
                  : `border-2 ${item.borderClass} ${item.bgClass} hover:scale-[1.01] hover:shadow-sm`
              }`}
              key={item.key}
              onClick={() => setSeleccionada(item.key)}
              type="button"
            >
              {isSelected && (
                <span
                  aria-hidden="true"
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-base font-extrabold ${item.badgeClass}`}
                >
                  ✓
                </span>
              )}

              <EmocionIcon emocion={item.key} />

              <span className="text-xl font-extrabold text-[#111827]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <footer className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div aria-live="polite" className="min-h-6">
          {emocionGuardadaMeta !== null && (
            <p className="text-lg font-bold text-alumno-primario" role="status">
              ✓ Guardado: ahora te sientes{" "}
              {emocionGuardadaMeta.label.toLocaleLowerCase("es-ES")}.
            </p>
          )}
        </div>

        <button
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-alumno-primario px-8 py-3 text-lg font-extrabold text-white transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/25 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hayCambioSinGuardar}
          onClick={handleGuardar}
          type="button"
        >
          <span aria-hidden="true">✓</span>
          <span>
            {guardadaHoy !== null && !hayCambioSinGuardar
              ? "Guardado"
              : guardadaHoy !== null
                ? "Guardar cambio"
                : "Guardar"}
          </span>
        </button>
      </footer>
    </div>
  );
}