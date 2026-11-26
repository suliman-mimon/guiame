"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { urlDeImagen, type Imagen } from "../pictogramasDePrueba";
import { useCatalogo } from "./catalogo";

// Elegir un pictograma del catálogo del sistema (RF2.4: nada de subir imágenes
// propias). Diálogo nativo: se cierra con Esc y mantiene el foco dentro.

// Para buscar sin que importen mayúsculas ni tildes: «musica» encuentra «música».
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function MiniaturaPictograma({
  imagen,
  tamano = 56,
}: {
  imagen: Imagen;
  tamano?: number;
}) {
  return (
    <Image
      src={urlDeImagen(imagen)}
      unoptimized={!imagen.arasaacId}
      alt=""
      width={tamano}
      height={tamano}
      className="shrink-0 rounded-boton border border-panel-borde bg-white p-1"
      style={{ width: tamano, height: tamano }}
    />
  );
}

export default function SelectorPictograma({
  abierto,
  titulo,
  onElegir,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  onElegir: (imagenId: string) => void;
  onCerrar: () => void;
}) {
  const { catalogo } = useCatalogo();
  const dialogo = useRef<HTMLDialogElement>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const [busqueda, setBusqueda] = useState("");
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      buscador.current?.focus();
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const termino = normalizar(busqueda.trim());
  const resultados = termino
    ? catalogo.filter((p) => normalizar(p.textoAlternativo).includes(termino))
    : catalogo;

  // Cada vez que se abre, el buscador empieza vacío.
  function cerrar() {
    setBusqueda("");
    onCerrar();
  }

  function elegir(imagenId: string) {
    setBusqueda("");
    onElegir(imagenId);
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onClose={cerrar}
      className="m-auto w-[min(720px,calc(100vw-32px))] rounded-tarjeta border border-panel-borde bg-panel-superficie p-0 text-texto backdrop:bg-black/40"
    >
      <div className="flex max-h-[80vh] flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id={idTitulo} className="text-xl font-bold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={cerrar}
            className="min-h-11 rounded-boton px-3 font-bold text-panel-primario hover:bg-panel-primario-suave"
          >
            Cerrar
          </button>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-bold">Buscar en el catálogo de ARASAAC</span>
          <input
            ref={buscador}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por ejemplo: comedor, música, lavarse"
            className="min-h-11 rounded-boton border border-panel-borde-campo px-3"
          />
        </label>
        <p className="text-sm text-texto-suave" aria-live="polite">
          {resultados.length === 0
            ? `No hay ningún pictograma con «${busqueda.trim()}». Prueba con otra palabra, por ejemplo «deporte» o «comer».`
            : `${resultados.length} ${resultados.length === 1 ? "pictograma" : "pictogramas"}`}
        </p>
        <ul className="grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
          {resultados.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => elegir(p._id)}
                className="flex w-full flex-col items-center gap-2 rounded-boton border border-panel-borde p-2 hover:border-panel-primario hover:bg-panel-primario-suave"
              >
                <MiniaturaPictograma imagen={p} tamano={64} />
                <span className="text-center text-sm">{p.textoAlternativo}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
