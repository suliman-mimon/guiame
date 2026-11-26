"use client";

import { useState, type FormEvent } from "react";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { hoyEnMadrid } from "@/components/panel/fechas";
import { DURACION_TAREA_PROPIA, MAX_TITULO_TAREA } from "@/lib/tareaPropia";
import { fechaHoraTareaEnMadrid, urlPictograma } from "./horario";

export default function NuevaTarea({
  fechaInicial,
  onCreada,
  onCancelar,
}: {
  fechaInicial: string;
  onCreada: (fecha: string, hora: string) => void;
  onCancelar: () => void;
}) {
  const pictogramas = useQuery(api.tareasAlumno.catalogo, {});
  const crear = useMutation(api.tareasAlumno.crear);
  const hoy = hoyEnMadrid();
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(fechaInicial < hoy ? hoy : fechaInicial);
  const [hora, setHora] = useState("");
  const [imagenId, setImagenId] = useState<Id<"imagenes">>();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;
    setError("");
    const fInicioProgramada = fechaHoraTareaEnMadrid(fecha, hora);
    if (fInicioProgramada === null || fInicioProgramada <= Date.now()) {
      setError(
        "Elige una fecha y una hora futuras. Si coincide con un cambio de hora, elige otra hora.",
      );
      return;
    }
    if (!imagenId || !titulo.trim()) {
      setError("Escribe el título y elige un pictograma.");
      return;
    }

    setGuardando(true);
    try {
      await crear({ titulo, imagenId, fInicioProgramada });
      onCreada(fecha, hora);
    } catch (fallo) {
      setError(
        fallo instanceof ConvexError && typeof fallo.data === "string"
          ? fallo.data
          : "No se pudo guardar la tarea. Inténtalo de nuevo.",
      );
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardar}
      aria-label="Nueva tarea"
      className="grid gap-4 rounded-2xl border-2 border-[#e4e0d7] bg-[#fffefb] p-4"
    >
      <h2 className="text-xl font-bold">Nueva tarea</h2>
      <fieldset disabled={guardando} className="grid gap-4">
        <label className="grid gap-1 font-bold">
          Título
          <input
            required
            maxLength={MAX_TITULO_TAREA}
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            className="min-h-12 rounded-lg border border-[#77736c] bg-white px-3 font-normal"
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="grid gap-1 font-bold">
            Fecha
            <input
              type="date"
              required
              min={hoy}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className="min-h-12 rounded-lg border border-[#77736c] bg-white px-3 font-normal"
            />
          </label>
          <label className="grid gap-1 font-bold">
            Hora
            <input
              type="time"
              required
              value={hora}
              aria-describedby="duracion-tarea"
              onChange={(event) => setHora(event.target.value)}
              className="min-h-12 rounded-lg border border-[#77736c] bg-white px-3 font-normal"
            />
          </label>
        </div>
        <p id="duracion-tarea">
          La tarea dura {DURACION_TAREA_PROPIA} minutos. Hora de Madrid.
        </p>
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-bold">Elige un pictograma</legend>
          {pictogramas === undefined && (
            <p role="status">Cargando pictogramas…</p>
          )}
          {pictogramas?.length === 0 && <p>No hay pictogramas disponibles.</p>}
          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">
            {pictogramas?.map((pictograma) => (
              <label
                key={pictograma.id}
                className="flex min-h-14 cursor-pointer items-center gap-2 rounded-lg border border-[#77736c] p-2"
              >
                <input
                  type="radio"
                  name="pictograma"
                  required
                  checked={imagenId === pictograma.id}
                  onChange={() => setImagenId(pictograma.id)}
                />
                <Image
                  src={urlPictograma(pictograma.arasaacId)}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                />
                {pictograma.nombre}
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>
      {error && (
        <p role="alert" className="font-bold text-[#9a3412]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={guardando || !pictogramas?.length}
          className="min-h-12 rounded-xl bg-[#20615b] px-4 font-bold text-white disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar tarea"}
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={onCancelar}
          className="min-h-12 rounded-xl border border-[#20615b] px-4 font-bold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
