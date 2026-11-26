"use client";

import { useCatalogo } from "./catalogo";
import { MiniaturaPictograma } from "./SelectorPictograma";
import {
  TIPOS,
  franjaTexto,
  type BorradorActividad,
  type Errores,
  type Solapamiento,
} from "./borrador";
import type { EstudianteResumen } from "../datosDePrueba";
import { fechaLarga } from "../fechas";

// Paso 3 · Para quién (RF2.5, RF2.6) y resumen de toda la actividad con todos sus
// pasos a la vista antes de guardar (GM-47, pedido de la profesora).

const NOMBRE_MEDIO = { pictograma: "Pictograma", video: "Vídeo", audio: "Audio" } as const;

function nombreCorto(e: EstudianteResumen) {
  return `${e.nombre} ${e.inicialApellido}.`;
}

export default function PasoParaQuien({
  borrador,
  cambiar,
  errores,
  estudiantes,
  solapamientos,
}: {
  borrador: BorradorActividad;
  cambiar: (parcial: Partial<BorradorActividad>) => void;
  errores: Errores;
  estudiantes: EstudianteResumen[];
  solapamientos: Solapamiento[];
}) {
  const { buscarImagen } = useCatalogo();
  const elegidos = new Set(borrador.estudiantes);
  const conChoque = new Set(solapamientos.map((s) => s.estudianteId)).size;
  const todos = estudiantes.length > 0 && estudiantes.every((e) => elegidos.has(e.id));
  const pictograma = borrador.imagenId ? buscarImagen(borrador.imagenId) : undefined;
  const tipo = TIPOS.find((t) => t.valor === borrador.tipo)?.texto;

  function alternar(id: string) {
    const siguiente = new Set(elegidos);
    if (siguiente.has(id)) siguiente.delete(id);
    else siguiente.add(id);
    cambiar({ estudiantes: [...siguiente] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-bold">¿Para quién es?</legend>
        <button
          type="button"
          onClick={() => cambiar({ estudiantes: todos ? [] : estudiantes.map((e) => e.id) })}
          className="min-h-11 w-fit rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
        >
          {todos ? "Quitar a toda la clase" : "Elegir a toda la clase"}
        </button>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {estudiantes.map((e) => {
            const choques = solapamientos.filter((s) => s.estudianteId === e.id);
            return (
              <li key={e.id}>
                <label
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-boton border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-panel-primario ${
                    choques.length > 0
                      ? "border-alerta"
                      : elegidos.has(e.id)
                        ? "border-panel-primario bg-panel-primario-suave"
                        : "border-panel-borde"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={elegidos.has(e.id)}
                    onChange={() => alternar(e.id)}
                    className="mt-1 h-5 w-5 accent-panel-primario"
                  />
                  <span className="flex flex-col">
                    <span className="font-bold">{nombreCorto(e)}</span>
                    <span className="text-sm text-texto-suave">{e.clase}</span>
                    {choques.map((c) => (
                      <span key={c.actividad.id} className="text-sm font-bold text-alerta">
                        Ya tiene «{c.actividad.titulo}» {franjaTexto(c.actividad.inicio, c.actividad.fin)}
                      </span>
                    ))}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {errores.estudiantes && <p className="font-bold text-alerta">{errores.estudiantes}</p>}
        {solapamientos.length > 0 && (
          <p role="alert" className="rounded-boton bg-alerta-suave px-3 py-2 font-bold text-alerta">
            No se puede guardar: la actividad se solapa con otra en la agenda de{" "}
            {conChoque === 1 ? "un estudiante" : `${conChoque} estudiantes`}. Cambia la hora o
            quita {conChoque === 1 ? "a ese estudiante" : "a esos estudiantes"}.
          </p>
        )}
      </fieldset>

      <aside
        aria-label="Resumen de la actividad"
        className="flex flex-col gap-4 rounded-tarjeta border border-panel-borde bg-panel-superficie p-5"
      >
        <h2 className="text-lg font-bold">Resumen</h2>
        <div className="flex items-center gap-3">
          {pictograma && <MiniaturaPictograma imagen={pictograma} tamano={48} />}
          <div>
            <p className="font-bold">{borrador.titulo || "Sin título"}</p>
            <p className="text-sm text-texto-suave">
              {tipo ?? "Sin tipo"}
              {borrador.fecha && ` · ${fechaLarga(borrador.fecha)}`}
              {borrador.inicio && borrador.fin && ` · ${franjaTexto(borrador.inicio, borrador.fin)}`}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 font-bold">
            {borrador.pasos.length} {borrador.pasos.length === 1 ? "paso" : "pasos"}
          </p>
          <ol className="flex flex-col gap-2">
            {borrador.pasos.map((p, i) => {
              const picto = p.imagenId ? buscarImagen(p.imagenId) : undefined;
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel-primario text-sm font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  {p.medio === "pictograma" && picto ? (
                    <MiniaturaPictograma imagen={picto} tamano={32} />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block">{p.texto || "Sin texto"}</span>
                    <span className="text-sm text-texto-suave">
                      {NOMBRE_MEDIO[p.medio]}
                      {p.archivo ? ` · ${p.archivo.nombre}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="text-sm text-texto-suave">
          {borrador.estudiantes.length === 0
            ? "Todavía no has elegido para quién es."
            : `Para ${borrador.estudiantes.length} ${borrador.estudiantes.length === 1 ? "estudiante" : "estudiantes"}.`}
        </p>
      </aside>
    </div>
  );
}
