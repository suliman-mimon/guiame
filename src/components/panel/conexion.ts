"use client";

// Paso de lo que devuelven las consultas del panel (convex/panel.ts) a la forma
// que ya usaban las pantallas con datos de prueba. Lo que depende de la hora
// (qué va «ahora», los retrasos) se calcula aquí con el reloj del navegador,
// para que se actualice solo cada minuto sin volver a pedir nada al servidor.

import { useEffect, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "convex/_generated/api";
import type { EstudianteResumen } from "./datosDePrueba";
import type { ActividadDeAgenda } from "./agendaDePrueba";
import { horaEnMadrid } from "./fechas";

export type EstudianteDelServidor = FunctionReturnType<typeof api.panel.misEstudiantes>[number];
export type AgendaDelServidor = NonNullable<FunctionReturnType<typeof api.panel.agendaDeEstudiante>>;

const MINUTO = 60 * 1000;

/** La hora actual en ms, que se renueva cada 30 s. */
export function useAhora(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

type ConHoras = {
  titulo: string;
  fInicioProgramada: number;
  hInicioReal?: number;
  hFinReal?: number;
};

/**
 * Progreso del día (RF5.2), qué hace ahora o qué le toca después, y el retraso
 * (RF5.1): la primera actividad cuya hora ya pasó y que no ha empezado.
 */
export function resumirDia(realizaciones: ConHoras[], ahora: number) {
  const ordenadas = [...realizaciones].sort((a, b) => a.fInicioProgramada - b.fInicioProgramada);
  const hechas = ordenadas.filter((r) => r.hFinReal !== undefined).length;
  const actual = ordenadas.find((r) => r.hFinReal === undefined);
  const atrasada = ordenadas.find(
    (r) =>
      r.hInicioReal === undefined && r.hFinReal === undefined && r.fInicioProgramada + MINUTO <= ahora,
  );
  return {
    hechas,
    total: ordenadas.length,
    actividadActual: actual
      ? {
          titulo: actual.titulo,
          momento:
            actual.hInicioReal !== undefined || actual.fInicioProgramada <= ahora
              ? ("ahora" as const)
              : ("siguiente" as const),
        }
      : null,
    retraso: atrasada
      ? {
          actividad: atrasada.titulo,
          minutos: Math.floor((ahora - atrasada.fInicioProgramada) / MINUTO),
        }
      : null,
  };
}

export function aResumen(
  estudiante: { id: string; nombre: string; apellidos: string; clase: string | null },
  realizaciones: ConHoras[],
  ahora: number,
): EstudianteResumen {
  return {
    id: estudiante.id,
    nombre: estudiante.nombre,
    inicialApellido: estudiante.apellidos.trim().charAt(0).toUpperCase(),
    clase: estudiante.clase ?? "Sin clase",
    ...resumirDia(realizaciones, ahora),
  };
}

export function aActividadDeAgenda(a: AgendaDelServidor["actividades"][number]): ActividadDeAgenda {
  return {
    id: a.id,
    actividadId: a.actividadId,
    titulo: a.titulo,
    inicio: horaEnMadrid(a.fInicioProgramada),
    fin: horaEnMadrid(a.fFinProgramada),
    imagen: a.imagen,
    numPasos: a.medios.length,
    medios: a.medios,
    estado:
      a.hFinReal !== undefined ? "hecha" : a.hInicioReal !== undefined ? "en_curso" : "pendiente",
    inicioReal: a.hInicioReal !== undefined ? horaEnMadrid(a.hInicioReal) : undefined,
    finReal: a.hFinReal !== undefined ? horaEnMadrid(a.hFinReal) : undefined,
  };
}
