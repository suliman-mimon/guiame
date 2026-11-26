"use client";

import { buscarImagen } from "./catalogo";
import { MiniaturaPictograma } from "./SelectorPictograma";
import { nuevoPaso, type BorradorActividad, type Errores, type PasoBorrador } from "./borrador";
import type { MedioDePaso } from "../agendaDePrueba";
import { IconoMas } from "../Iconos";

// Paso 2 · Pasos (W4b, RF2.7): dividir la actividad en pasos cortos. Cada paso
// tiene su texto y UN formato, elegido con un botón propio (pictograma, vídeo o
// audio), como pidió la profesora. Los archivos de vídeo y audio se suben con GM-12.

const MEDIOS: { valor: MedioDePaso; texto: string }[] = [
  { valor: "pictograma", texto: "Pictograma" },
  { valor: "video", texto: "Vídeo" },
  { valor: "audio", texto: "Audio" },
];

const ACEPTA: Record<Exclude<MedioDePaso, "pictograma">, string> = {
  video: "video/mp4",
  audio: "audio/mpeg,audio/mp3",
};

function tamanoLegible(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function PasoPasos({
  borrador,
  cambiar,
  errores,
  abrirSelectorDePaso,
}: {
  borrador: BorradorActividad;
  cambiar: (parcial: Partial<BorradorActividad>) => void;
  errores: Errores;
  abrirSelectorDePaso: (pasoId: string) => void;
}) {
  const pasos = borrador.pasos;

  function cambiarPaso(id: string, parcial: Partial<PasoBorrador>) {
    cambiar({ pasos: pasos.map((p) => (p.id === id ? { ...p, ...parcial } : p)) });
  }

  function mover(indice: number, desplazamiento: -1 | 1) {
    const destino = indice + desplazamiento;
    if (destino < 0 || destino >= pasos.length) return;
    const copia = [...pasos];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    cambiar({ pasos: copia });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-texto-suave">
        Divide la actividad en pasos cortos. Cada paso puede tener un pictograma, un vídeo o un
        audio.
      </p>
      {errores.pasos && <p className="font-bold text-alerta">{errores.pasos}</p>}

      <ol className="flex flex-col gap-4">
        {pasos.map((paso, i) => {
          const numero = i + 1;
          const pictograma = paso.imagenId ? buscarImagen(paso.imagenId) : undefined;
          const errorTexto = errores[`${paso.id}.texto`];
          const errorMedio = errores[`${paso.id}.medio`];
          return (
            <li
              key={paso.id}
              className="flex gap-4 rounded-tarjeta border border-panel-borde bg-panel-superficie p-4"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel-primario font-bold text-white"
              >
                {numero}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`texto-${paso.id}`} className="text-sm text-texto-suave">
                    Paso {numero}: qué tiene que hacer
                  </label>
                  <input
                    id={`texto-${paso.id}`}
                    value={paso.texto}
                    onChange={(e) => cambiarPaso(paso.id, { texto: e.target.value })}
                    placeholder="Por ejemplo: Lávate las manos"
                    aria-invalid={Boolean(errorTexto)}
                    className="min-h-11 rounded-boton border border-panel-borde px-3"
                  />
                  {errorTexto && <p className="text-sm font-bold text-alerta">{errorTexto}</p>}
                </div>

                <div role="group" aria-label={`Formato del paso ${numero}`} className="flex flex-wrap gap-2">
                  {MEDIOS.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      aria-pressed={paso.medio === m.valor}
                      onClick={() =>
                        cambiarPaso(paso.id, { medio: m.valor, archivo: undefined })
                      }
                      className={`min-h-11 rounded-boton border-2 px-4 font-bold ${
                        paso.medio === m.valor
                          ? "border-panel-primario bg-panel-primario-suave text-panel-primario"
                          : "border-panel-borde text-texto"
                      }`}
                    >
                      {m.texto}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-boton bg-panel-fondo p-3">
                  {paso.medio === "pictograma" ? (
                    <>
                      {pictograma ? (
                        <>
                          <MiniaturaPictograma imagen={pictograma} tamano={48} />
                          <span className="flex-1 capitalize">{pictograma.textoAlternativo}</span>
                        </>
                      ) : (
                        <span className="flex-1 text-texto-suave">Sin pictograma</span>
                      )}
                      <button
                        type="button"
                        onClick={() => abrirSelectorDePaso(paso.id)}
                        className="min-h-11 rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
                      >
                        {pictograma ? "Cambiar" : "Elegir pictograma"}
                        <span className="sr-only"> del paso {numero}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">
                        {paso.archivo
                          ? `${paso.archivo.nombre} · ${tamanoLegible(paso.archivo.tamano)}`
                          : `Sin ${paso.medio === "video" ? "vídeo" : "audio"}`}
                      </span>
                      <label className="flex min-h-11 cursor-pointer items-center rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-panel-primario">
                        {paso.archivo ? "Cambiar" : `Elegir ${paso.medio === "video" ? "vídeo (MP4)" : "audio (MP3)"}`}
                        <input
                          type="file"
                          accept={ACEPTA[paso.medio]}
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) cambiarPaso(paso.id, { archivo: { nombre: f.name, tamano: f.size } });
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
                {errorMedio && <p className="text-sm font-bold text-alerta">{errorMedio}</p>}
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir el paso ${numero}`}
                  className="flex h-11 w-11 items-center justify-center rounded-boton border border-panel-borde text-lg disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === pasos.length - 1}
                  aria-label={`Bajar el paso ${numero}`}
                  className="flex h-11 w-11 items-center justify-center rounded-boton border border-panel-borde text-lg disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => cambiar({ pasos: pasos.filter((p) => p.id !== paso.id) })}
                  aria-label={`Borrar el paso ${numero}`}
                  className="flex h-11 w-11 items-center justify-center rounded-boton border border-panel-borde text-lg text-alerta"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => cambiar({ pasos: [...pasos, nuevoPaso()] })}
        className="flex min-h-11 items-center justify-center gap-2 rounded-tarjeta border-2 border-dashed border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
      >
        <IconoMas className="h-5 w-5" />
        Añadir paso
      </button>
    </div>
  );
}
