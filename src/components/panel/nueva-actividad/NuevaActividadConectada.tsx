"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import AsistenteNuevaActividad from "./AsistenteNuevaActividad";
import { nuevoPaso, type BorradorActividad } from "./borrador";
import { aResumen, useAhora } from "../conexion";
import { hoyEnMadrid, rangoDelDia } from "../fechas";

// W4 conectada: los estudiantes entre los que elegir son los del tutor
// (panel:misEstudiantes). Si llega desde la agenda de un alumno («Añadir
// actividad»), ese alumno y ese día ya vienen elegidos.

export default function NuevaActividadConectada({
  estudiante,
  fecha,
}: {
  estudiante?: string;
  fecha?: string;
}) {
  const hoy = hoyEnMadrid();
  const ahora = useAhora();
  const datos = useQuery(api.panel.misEstudiantes, rangoDelDia(hoy));

  if (datos === undefined) {
    return (
      <p className="mx-auto max-w-5xl text-texto-suave" aria-live="polite">
        Cargando…
      </p>
    );
  }

  const estudiantes = datos.map((e) => aResumen(e, e.realizaciones, ahora));
  const inicial: BorradorActividad = {
    titulo: "",
    descripcion: "",
    tipo: null,
    imagenId: null,
    fecha: fecha && fecha >= hoy ? fecha : hoy,
    inicio: "",
    fin: "",
    pasos: [nuevoPaso()],
    estudiantes: estudiante && estudiantes.some((e) => e.id === estudiante) ? [estudiante] : [],
  };

  return <AsistenteNuevaActividad inicial={inicial} estudiantes={estudiantes} editandoId={null} />;
}
