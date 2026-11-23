"use client";

import { useState } from "react";
import TarjetaEstudiante from "./TarjetaEstudiante";
import type { EstudianteResumen } from "./datosDePrueba";

// W2 · Filtros de «Mis estudiantes» (GM-26, HU-11): por nombre, por clase y
// «solo con retraso». El filtro de clase solo aparece si el profesional tiene
// alumnos de más de una clase (por ejemplo, la fisio o el logopeda).

// Para buscar sin que importen mayúsculas ni tildes: «lucia» encuentra «Lucía».
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const TODAS = "todas";

export default function ListaEstudiantes({ estudiantes }: { estudiantes: EstudianteResumen[] }) {
  const [nombre, setNombre] = useState("");
  const [clase, setClase] = useState(TODAS);
  const [soloRetraso, setSoloRetraso] = useState(false);

  const clases = [...new Set(estudiantes.map((e) => e.clase))].sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true }),
  );
  const variasClases = clases.length > 1;
  const termino = normalizar(nombre.trim());
  const porClaseYNombre = estudiantes.filter(
    (e) =>
      (clase === TODAS || e.clase === clase) &&
      (!termino || normalizar(`${e.nombre} ${e.inicialApellido}`).includes(termino)),
  );
  // El número del botón cuenta los retrasos entre los alumnos que ya se ven.
  const conRetraso = porClaseYNombre.filter((e) => e.retraso !== null).length;
  const visibles = soloRetraso ? porClaseYNombre.filter((e) => e.retraso !== null) : porClaseYNombre;
  const hayFiltros = termino !== "" || clase !== TODAS || soloRetraso;

  function quitarFiltros() {
    setNombre("");
    setClase(TODAS);
    setSoloRetraso(false);
  }

  if (estudiantes.length === 0) {
    return (
      <p className="rounded-tarjeta border border-panel-borde bg-panel-superficie p-6 text-texto-suave">
        Todavía no tienes estudiantes asignados. Cuando el administrador te asigne una clase,
        aparecerán aquí.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="search"
        aria-label="Filtrar estudiantes"
        className="flex flex-wrap items-end gap-3 rounded-tarjeta border border-panel-borde bg-panel-superficie p-4"
      >
        <label className="flex min-w-56 flex-1 flex-col gap-1">
          <span className="text-sm font-bold text-texto">Buscar por nombre</span>
          <input
            type="search"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Por ejemplo: Lucía"
            className="min-h-11 rounded-boton border border-panel-borde bg-white px-3"
          />
        </label>

        {variasClases && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-texto">Clase</span>
            <select
              value={clase}
              onChange={(e) => setClase(e.target.value)}
              className="min-h-11 rounded-boton border border-panel-borde bg-white px-3"
            >
              <option value={TODAS}>Todas las clases</option>
              {clases.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          aria-pressed={soloRetraso}
          onClick={() => setSoloRetraso((v) => !v)}
          disabled={conRetraso === 0 && !soloRetraso}
          className={`min-h-11 rounded-boton border-2 px-4 font-bold disabled:opacity-50 ${
            soloRetraso
              ? "border-alerta bg-alerta-suave text-alerta"
              : "border-panel-borde bg-white text-texto hover:bg-panel-fondo"
          }`}
        >
          {soloRetraso && <span aria-hidden="true">✓ </span>}
          Con retraso ({conRetraso})
        </button>

        {hayFiltros && (
          <button
            type="button"
            onClick={quitarFiltros}
            className="min-h-11 rounded-boton px-3 font-bold text-panel-primario underline underline-offset-2 hover:bg-panel-primario-suave"
          >
            Quitar filtros
          </button>
        )}
      </div>

      <p aria-live="polite" className="text-sm text-texto-suave">
        {hayFiltros
          ? `${visibles.length} de ${estudiantes.length} estudiantes`
          : `${estudiantes.length} estudiantes`}
      </p>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-tarjeta border border-panel-borde bg-panel-superficie p-6">
          <p className="text-texto">Ningún estudiante coincide con estos filtros.</p>
          <button
            type="button"
            onClick={quitarFiltros}
            className="min-h-11 rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((estudiante) => (
            <li key={estudiante.id} className="flex">
              <TarjetaEstudiante estudiante={estudiante} mostrarClase={variasClases} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
