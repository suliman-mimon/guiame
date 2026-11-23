// Agenda de prueba de W3 «Agenda del estudiante», sacada de los bocetos de Figma.
//
// La consulta real (GM-16, Ignacio) debe devolver, para un estudiante y un día,
// una lista de `ActividadDeAgenda` con esta misma forma, para que GM-22 la conecte
// sustituyendo `agendaDePrueba` por `useQuery(api.panel.agendaDeEstudiante, ...)`.
//
// De dónde sale cada campo en el esquema v2:
//   realizaciones (del estudiante y del día, sin las canceladas)
//     → id, inicio y fin (fInicioProgramada / fFinProgramada en hora de Madrid),
//       inicioReal y finReal (hInicioReal / hFinReal) y el estado:
//       sin hInicioReal = "pendiente", con hInicioReal y sin hFinReal = "en_curso",
//       con hFinReal = "hecha".
//   actividades (realizacion.actividadId) → actividadId, titulo
//   imagenes (actividad.imagenId) → imagen
//   pasos (by_actividad_and_orden) → numPasos y medios (tipoMedio de cada paso)

import { pictogramaDePrueba, type Imagen } from "./pictogramasDePrueba";

export type MedioDePaso = "pictograma" | "video" | "audio";

export type EstadoRealizacion = "pendiente" | "en_curso" | "hecha";

export type ActividadDeAgenda = {
  /** `Id<"realizaciones">`: la actividad asignada a un estudiante a una hora. */
  id: string;
  /** `Id<"actividades">`: hace falta para editarla (GM-11). */
  actividadId: string;
  titulo: string;
  /** Hora programada, "HH:MM" en hora de Madrid. */
  inicio: string;
  fin: string;
  imagen: Imagen;
  numPasos: number;
  medios: MedioDePaso[];
  estado: EstadoRealizacion;
  /** Horas reales de Empiezo y Termino (RF3.1, RF3.2), "HH:MM". */
  inicioReal?: string;
  finReal?: string;
  /**
   * Solo si está en curso: por qué paso va. El esquema v2 todavía no lo guarda
   * (propuesto a Suliman como campo opcional de `realizaciones`); si no llega,
   * W3 dice «En curso» sin el número de paso.
   */
  pasoActual?: number;
};

/**
 * Emoción del día (RF3.3): `estadosEmocionales` del estudiante con
 * `fechaRegistro` de hoy; `emocion` es el `nombre` del `catalogoEmociones` y
 * `hora` sale del `_creationTime` del registro, en hora de Madrid.
 */
export type EstadoEmocional = {
  emocion: string;
  hora: string;
};

export const agendaDePrueba: ActividadDeAgenda[] = [
  {
    id: "r1",
    actividadId: "a1",
    titulo: "Entrar a clase",
    inicio: "09:00",
    fin: "09:30",
    imagen: pictogramaDePrueba("9815"),
    numPasos: 1,
    medios: ["pictograma"],
    estado: "hecha",
    inicioReal: "09:01",
    finReal: "09:25",
  },
  {
    id: "r2",
    actividadId: "a2",
    titulo: "Descanso",
    inicio: "11:00",
    fin: "11:30",
    imagen: pictogramaDePrueba("24503"),
    numPasos: 1,
    medios: ["pictograma"],
    estado: "hecha",
    inicioReal: "11:01",
    finReal: "11:25",
  },
  {
    id: "r3",
    actividadId: "a3",
    titulo: "Taller de cocina",
    inicio: "11:30",
    fin: "12:30",
    imagen: pictogramaDePrueba("2342"),
    numPasos: 3,
    medios: ["pictograma", "video", "audio"],
    estado: "en_curso",
    inicioReal: "11:32",
    pasoActual: 2,
  },
  {
    id: "r4",
    actividadId: "a4",
    titulo: "Logopedia",
    inicio: "12:30",
    fin: "13:30",
    imagen: pictogramaDePrueba("32428"),
    numPasos: 2,
    medios: ["pictograma", "audio"],
    estado: "pendiente",
  },
  {
    id: "r5",
    actividadId: "a5",
    titulo: "Comedor",
    inicio: "14:00",
    fin: "15:00",
    imagen: pictogramaDePrueba("5970"),
    numPasos: 1,
    medios: ["pictograma"],
    estado: "pendiente",
  },
  {
    id: "r6",
    actividadId: "a6",
    titulo: "Música",
    inicio: "15:00",
    fin: "16:00",
    imagen: pictogramaDePrueba("24791"),
    numPasos: 1,
    medios: ["pictograma"],
    estado: "pendiente",
  },
  {
    id: "r7",
    actividadId: "a7",
    titulo: "Ir al bus",
    inicio: "16:00",
    fin: "16:30",
    imagen: pictogramaDePrueba("2262"),
    numPasos: 2,
    medios: ["pictograma"],
    estado: "pendiente",
  },
];

export const emocionDePrueba: EstadoEmocional = { emocion: "feliz", hora: "09:05" };
