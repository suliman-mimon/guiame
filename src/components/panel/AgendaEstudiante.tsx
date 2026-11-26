"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { EstudianteResumen } from "./datosDePrueba";
import type { ActividadDeAgenda, EstadoEmocional, MedioDePaso } from "./agendaDePrueba";
import { urlDeImagen } from "./pictogramasDePrueba";
import {
  INICIO_TARDE,
  aMinutos,
  fechaLarga,
  horaCorta,
  hoyEnMadrid,
  minutosAhoraEnMadrid,
  sumarDias,
} from "./fechas";
import { IconoMas } from "./Iconos";

// W3 · Agenda del estudiante para el tutor (RF5.1, RF5.2): el día del alumno en
// mañana y tarde, con el estado de cada actividad y las horas reales de Empiezo
// y Termino. Se actualiza sola cuando GM-16 la conecte a Convex (tiempo real).

const NOMBRE_MEDIO: Record<MedioDePaso, string> = {
  pictograma: "pictograma",
  video: "vídeo",
  audio: "audio",
};

function listaNatural(palabras: string[]) {
  if (palabras.length <= 1) return palabras.join("");
  return `${palabras.slice(0, -1).join(", ")} y ${palabras.at(-1)}`;
}

function Estado({ actividad }: { actividad: ActividadDeAgenda }) {
  if (actividad.estado === "hecha") {
    return (
      <span className="rounded-full bg-exito-suave px-3 py-1 text-sm font-bold text-exito">
        Hecho · {horaCorta(actividad.inicioReal ?? "")} a {horaCorta(actividad.finReal ?? "")}
      </span>
    );
  }
  if (actividad.estado === "en_curso") {
    return (
      <span className="rounded-full bg-aviso-suave px-3 py-1 text-sm font-bold text-texto">
        {actividad.pasoActual
          ? `En curso · paso ${actividad.pasoActual} de ${actividad.numPasos}`
          : "En curso"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-panel-pista px-3 py-1 text-sm text-texto-secundario">
      Pendiente
    </span>
  );
}

export default function AgendaEstudiante({
  estudiante,
  fecha,
  setFecha,
  agenda,
  emocionDeHoy,
}: {
  estudiante: EstudianteResumen;
  /** Día que se está viendo, "YYYY-MM-DD". */
  fecha: string;
  setFecha: (fecha: string) => void;
  /** Actividades de ese día; undefined mientras llegan del servidor. */
  agenda: ActividadDeAgenda[] | undefined;
  emocionDeHoy: EstadoEmocional | null;
}) {
  const hoy = hoyEnMadrid();
  const [franja, setFranja] = useState<"manana" | "tarde">(
    minutosAhoraEnMadrid() >= INICIO_TARDE ? "tarde" : "manana",
  );

  const nombreCorto = `${estudiante.nombre} ${estudiante.inicialApellido}.`;
  const iniciales = `${estudiante.nombre[0]}${estudiante.inicialApellido}`.toUpperCase();
  const esHoy = fecha === hoy;

  const visibles = (agenda ?? [])
    .filter((a) =>
      franja === "manana" ? aMinutos(a.inicio) < INICIO_TARDE : aMinutos(a.inicio) >= INICIO_TARDE,
    )
    .sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <nav aria-label="Ruta" className="text-sm text-texto-suave">
        <Link href="/panel" className="underline underline-offset-2 hover:text-texto">
          Mis estudiantes
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{nombreCorto}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-panel-primario-suave text-lg font-bold text-panel-primario"
          >
            {iniciales}
          </span>
          <div>
            <h1 className="text-3xl font-bold text-texto">{nombreCorto}</h1>
            {esHoy && emocionDeHoy && (
              <p className="mt-1 text-texto-suave">
                Hoy se siente {emocionDeHoy.emocion} ({horaCorta(emocionDeHoy.hora)})
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/panel/actividades/nueva?estudiante=${estudiante.id}&fecha=${fecha}`}
            className="flex min-h-11 items-center gap-2 rounded-boton bg-panel-primario px-4 font-bold text-white transition-colors hover:bg-panel-primario-hover"
          >
            <IconoMas className="h-5 w-5" />
            Añadir actividad
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFecha(sumarDias(fecha, -1))}
            aria-label="Día anterior"
            className="flex h-11 w-11 items-center justify-center rounded-boton border border-panel-borde bg-panel-superficie text-xl text-texto hover:bg-panel-fondo"
          >
            ‹
          </button>
          <p className="min-w-56 text-center text-lg font-bold text-texto" aria-live="polite">
            {fechaLarga(fecha)}
            {esHoy && <span className="ml-2 text-sm font-normal text-texto-suave">(hoy)</span>}
          </p>
          <button
            type="button"
            onClick={() => setFecha(sumarDias(fecha, 1))}
            aria-label="Día siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-boton border border-panel-borde bg-panel-superficie text-xl text-texto hover:bg-panel-fondo"
          >
            ›
          </button>
        </div>

        <div role="group" aria-label="Parte del día" className="flex rounded-full bg-panel-pista p-1">
          {(["manana", "tarde"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={franja === f}
              onClick={() => setFranja(f)}
              className={`min-h-11 rounded-full px-5 font-bold transition-colors ${
                franja === f ? "bg-panel-primario text-white" : "text-texto-secundario"
              }`}
            >
              {f === "manana" ? "Mañana" : "Tarde"}
            </button>
          ))}
        </div>
      </div>

      {agenda === undefined ? (
        <p className="rounded-tarjeta border border-panel-borde bg-panel-superficie p-6 text-texto-suave" aria-live="polite">
          Cargando la agenda…
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-tarjeta border border-panel-borde bg-panel-superficie p-6 text-texto-suave">
          {nombreCorto} no tiene actividades {franja === "manana" ? "por la mañana" : "por la tarde"} este día.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {visibles.map((a) => (
            <li
              key={a.id}
              className={`flex flex-wrap items-center gap-4 rounded-tarjeta border bg-panel-superficie p-4 ${
                a.estado === "en_curso" ? "border-2 border-aviso" : "border-panel-borde"
              }`}
            >
              <p className="w-14 shrink-0 text-right font-bold text-texto">
                <span className={a.estado === "hecha" ? "text-texto-suave line-through" : ""}>
                  {horaCorta(a.inicio)}
                </span>
                <br />
                <span className="text-sm font-normal text-texto-suave">{horaCorta(a.fin)}</span>
              </p>
              {a.imagen ? (
                <Image
                  src={urlDeImagen(a.imagen)}
                  // Solo optimizamos las de ARASAAC (next.config.ts); las demás vienen
                  // del almacenamiento de Convex.
                  unoptimized={!a.imagen.arasaacId}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-boton bg-panel-fondo p-1"
                />
              ) : (
                <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-boton bg-panel-fondo" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-texto">{a.titulo}</p>
                <p className="text-sm text-texto-suave">
                  {a.numPasos} {a.numPasos === 1 ? "paso" : "pasos"} ·{" "}
                  {listaNatural([...new Set(a.medios)].map((m) => NOMBRE_MEDIO[m]))}
                </p>
              </div>
              <Estado actividad={a} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
