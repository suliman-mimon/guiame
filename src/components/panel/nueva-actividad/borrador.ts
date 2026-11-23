// Estado del asistente «Nueva actividad» (W4) y sus reglas (RF2.1, RF2.4–RF2.7).
//
// La forma sigue el esquema v2 acordado (GM-03): tipo académica/profesional/
// familiar/del estudiante, un pictograma principal, pasos con un formato cada uno
// (pictograma, vídeo o audio) y la asignación a uno o varios estudiantes con día
// y horas. GM-24 envía este borrador a la mutación de Suliman (GM-07).

import type { ActividadDeAgenda, MedioDePaso } from "../agendaDePrueba";
import { aMinutos, horaCorta } from "../fechas";

export type TipoActividad = "academica" | "profesional" | "familiar" | "del_estudiante";

export const TIPOS: { valor: TipoActividad; texto: string }[] = [
  { valor: "academica", texto: "Académica" },
  { valor: "profesional", texto: "Profesional" },
  { valor: "familiar", texto: "Familiar" },
  { valor: "del_estudiante", texto: "Del estudiante" },
];

export type PasoBorrador = {
  id: string;
  texto: string;
  medio: MedioDePaso;
  /** Si el medio es pictograma. */
  arasaacId?: string;
  /** Si el medio es vídeo o audio: el archivo elegido (la subida llega con GM-12). */
  archivo?: { nombre: string; tamano: number };
};

export type BorradorActividad = {
  titulo: string;
  descripcion: string;
  tipo: TipoActividad | null;
  arasaacId: string | null;
  fecha: string;
  inicio: string;
  fin: string;
  pasos: PasoBorrador[];
  estudiantes: string[];
};

let contador = 0;
export function nuevoPaso(medio: MedioDePaso = "pictograma"): PasoBorrador {
  contador += 1;
  return { id: `paso-${Date.now()}-${contador}`, texto: "", medio };
}

export type Errores = Partial<Record<string, string>>;

/** RF2.1: título, tipo, pictograma, día y franja obligatorios; ni fecha pasada ni fin antes del inicio. */
export function validarDatos(b: BorradorActividad, hoy: string): Errores {
  const e: Errores = {};
  if (!b.titulo.trim()) e.titulo = "Escribe qué actividad es.";
  else if (b.titulo.trim().length > 100) e.titulo = "El título no puede pasar de 100 caracteres.";
  if (!b.arasaacId) e.pictograma = "Elige un pictograma del catálogo.";
  if (!b.tipo) e.tipo = "Elige el tipo de actividad.";
  if (!b.fecha) e.fecha = "Elige el día.";
  else if (b.fecha < hoy) e.fecha = "El día no puede ser anterior a hoy.";
  if (!b.inicio) e.inicio = "Elige la hora de inicio.";
  if (!b.fin) e.fin = "Elige la hora de fin.";
  if (b.inicio && b.fin && aMinutos(b.fin) <= aMinutos(b.inicio)) {
    e.fin = "La hora de fin tiene que ser posterior a la de inicio.";
  }
  return e;
}

/** RF2.7: al menos un paso; cada uno con texto y con su pictograma o su archivo. */
export function validarPasos(b: BorradorActividad): Errores {
  const e: Errores = {};
  if (b.pasos.length === 0) e.pasos = "Añade al menos un paso.";
  b.pasos.forEach((p, i) => {
    if (!p.texto.trim()) e[`${p.id}.texto`] = `Escribe qué tiene que hacer en el paso ${i + 1}.`;
    if (p.medio === "pictograma" && !p.arasaacId) {
      e[`${p.id}.medio`] = `Elige el pictograma del paso ${i + 1}.`;
    }
    if (p.medio !== "pictograma" && !p.archivo) {
      e[`${p.id}.medio`] = `Elige el ${p.medio === "video" ? "vídeo" : "audio"} del paso ${i + 1}.`;
    }
  });
  return e;
}

export type Solapamiento = { estudianteId: string; actividad: ActividadDeAgenda };

/** RF2.6: una actividad se solapa si comparte algún minuto con otra del mismo alumno ese día. */
export function buscarSolapamientos(
  b: BorradorActividad,
  agendaDe: (estudianteId: string, fecha: string) => ActividadDeAgenda[],
): Solapamiento[] {
  if (!b.fecha || !b.inicio || !b.fin) return [];
  const ini = aMinutos(b.inicio);
  const fin = aMinutos(b.fin);
  return b.estudiantes.flatMap((estudianteId) =>
    agendaDe(estudianteId, b.fecha)
      .filter((a) => aMinutos(a.inicio) < fin && ini < aMinutos(a.fin))
      .map((actividad) => ({ estudianteId, actividad })),
  );
}

export function franjaTexto(inicio: string, fin: string) {
  return `de ${horaCorta(inicio)} a ${horaCorta(fin)}`;
}
