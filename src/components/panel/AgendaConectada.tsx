"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import AgendaEstudiante from "./AgendaEstudiante";
import { aActividadDeAgenda, aResumen, useAhora, type AgendaDelServidor } from "./conexion";
import { horaEnMadrid, hoyEnMadrid, rangoDelDia } from "./fechas";

// W3 conectada (GM-22 + GM-16): la agenda del estudiante del día elegido, en
// tiempo real. Si el alumno pulsa Empiezo o Termino en su tablet, cambia aquí
// sin recargar.

export default function AgendaConectada({ estudianteId }: { estudianteId: string }) {
  const hoy = hoyEnMadrid();
  const [fecha, setFecha] = useState(hoy);
  const ahora = useAhora();
  const datos = useQuery(api.panel.agendaDeEstudiante, {
    estudianteId,
    fecha,
    ...rangoDelDia(fecha),
  });

  // Mientras llega un día nuevo se mantiene la cabecera del último que llegó.
  const [ultimo, setUltimo] = useState<AgendaDelServidor | null | undefined>(undefined);
  if (datos !== undefined && datos !== ultimo) setUltimo(datos);
  const mostrado = datos ?? ultimo;

  if (mostrado === undefined) {
    return (
      <p className="mx-auto max-w-5xl text-texto-suave" aria-live="polite">
        Cargando la agenda…
      </p>
    );
  }

  if (mostrado === null) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <h1 className="text-3xl font-bold text-texto">No encontramos a este estudiante</h1>
        <p className="text-texto-suave">Puede que no esté entre tus estudiantes asignados.</p>
        <Link href="/panel" className="font-bold text-panel-primario underline underline-offset-2">
          Volver a Mis estudiantes
        </Link>
      </div>
    );
  }

  return (
    <AgendaEstudiante
      estudiante={aResumen(mostrado.estudiante, mostrado.actividades, ahora)}
      fecha={fecha}
      setFecha={setFecha}
      agenda={datos ? datos.actividades.map(aActividadDeAgenda) : undefined}
      emocionDeHoy={
        mostrado.emocion
          ? { emocion: mostrado.emocion.nombre, hora: horaEnMadrid(mostrado.emocion.hora) }
          : null
      }
    />
  );
}
