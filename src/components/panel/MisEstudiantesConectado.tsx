"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ListaEstudiantes from "./ListaEstudiantes";
import { IconoMas } from "./Iconos";
import { aResumen, useAhora } from "./conexion";
import { fechaLarga, hoyEnMadrid, rangoDelDia } from "./fechas";

// W2 · Mis estudiantes conectada (GM-22 + GM-15): progreso del día, qué hace
// cada uno ahora y quién va con retraso (RF5.1, RF5.2, RF6.3), en tiempo real.

export default function MisEstudiantesConectado() {
  const hoy = hoyEnMadrid();
  const ahora = useAhora();
  const datos = useQuery(api.panel.misEstudiantes, rangoDelDia(hoy));
  const estudiantes = datos?.map((e) => aResumen(e, e.realizaciones, ahora));

  const clases = [...new Set((estudiantes ?? []).map((e) => e.clase))].sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true }),
  );
  const clasesTexto = new Intl.ListFormat("es", { type: "conjunction" }).format(clases);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-texto">Mis estudiantes</h1>
          <p className="mt-1 text-texto-suave">
            {clasesTexto ? `${clasesTexto} · ` : ""}
            {fechaLarga(hoy)}
          </p>
        </div>
        <Link
          href="/panel/actividades/nueva"
          className="flex min-h-11 items-center gap-2 rounded-boton bg-panel-primario px-4 font-semibold text-white transition-colors hover:bg-panel-primario-hover"
        >
          <IconoMas className="h-5 w-5" />
          Nueva actividad
        </Link>
      </header>

      {estudiantes === undefined ? (
        <p className="text-texto-suave" aria-live="polite">
          Cargando tus estudiantes…
        </p>
      ) : (
        <ListaEstudiantes estudiantes={estudiantes} />
      )}
    </div>
  );
}
