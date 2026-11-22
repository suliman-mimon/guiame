// Agenda de prueba de W3 «Agenda del estudiante», sacada de los bocetos de Figma.
//
// La consulta real (GM-16, Ignacio) debe devolver, para un estudiante y un día,
// una lista de `ActividadDeAgenda` con esta misma forma, para que GM-22 la conecte
// sustituyendo `agendaDePrueba` por `useQuery(api.panel.agendaDeEstudiante, ...)`.

export type MedioDePaso = "pictograma" | "video" | "audio";

export type EstadoRealizacion = "pendiente" | "en_curso" | "hecha";

export type ActividadDeAgenda = {
  /** Id de la realización (una actividad asignada a un estudiante a una hora). */
  id: string;
  titulo: string;
  /** Hora programada, "HH:MM" en hora de Madrid. */
  inicio: string;
  fin: string;
  arasaacId: string;
  numPasos: number;
  medios: MedioDePaso[];
  estado: EstadoRealizacion;
  /** Horas reales de Empiezo y Termino (RF3.1, RF3.2), "HH:MM". */
  inicioReal?: string;
  finReal?: string;
  /** Solo si está en curso: por qué paso va. */
  pasoActual?: number;
};

export type EstadoEmocional = {
  emocion: string;
  hora: string;
};

export const agendaDePrueba: ActividadDeAgenda[] = [
  {
    id: "r1",
    titulo: "Entrar a clase",
    inicio: "09:00",
    fin: "09:30",
    arasaacId: "9815",
    numPasos: 1,
    medios: ["pictograma"],
    estado: "hecha",
    inicioReal: "09:01",
    finReal: "09:25",
  },
  {
    id: "r2",
    titulo: "Descanso",
    inicio: "11:00",
    fin: "11:30",
    arasaacId: "24503",
    numPasos: 1,
    medios: ["pictograma"],
    estado: "hecha",
    inicioReal: "11:01",
    finReal: "11:25",
  },
  {
    id: "r3",
    titulo: "Taller de cocina",
    inicio: "11:30",
    fin: "12:30",
    arasaacId: "2342",
    numPasos: 3,
    medios: ["pictograma", "video", "audio"],
    estado: "en_curso",
    inicioReal: "11:32",
    pasoActual: 2,
  },
  {
    id: "r4",
    titulo: "Logopedia",
    inicio: "12:30",
    fin: "13:30",
    arasaacId: "32428",
    numPasos: 2,
    medios: ["pictograma", "audio"],
    estado: "pendiente",
  },
  {
    id: "r5",
    titulo: "Comedor",
    inicio: "14:00",
    fin: "15:00",
    arasaacId: "5970",
    numPasos: 1,
    medios: ["pictograma"],
    estado: "pendiente",
  },
  {
    id: "r6",
    titulo: "Música",
    inicio: "15:00",
    fin: "16:00",
    arasaacId: "24791",
    numPasos: 1,
    medios: ["pictograma"],
    estado: "pendiente",
  },
  {
    id: "r7",
    titulo: "Ir al bus",
    inicio: "16:00",
    fin: "16:30",
    arasaacId: "2262",
    numPasos: 2,
    medios: ["pictograma"],
    estado: "pendiente",
  },
];

export const emocionDePrueba: EstadoEmocional = { emocion: "feliz", hora: "09:05" };
