// Datos de prueba de W2 «Mis estudiantes», copiados de los bocetos de Figma.
//
// La consulta real (GM-15, Ignacio) debe devolver objetos con esta misma forma,
// `EstudianteResumen`, para que la pantalla se conecte sin cambiar nada más:
// se sustituye `estudiantesDePrueba` por `useQuery(api.panel.misEstudiantes, ...)`.

export type ActividadActual = {
  titulo: string;
  /** "ahora" si está en curso o toca ya; "siguiente" si es la próxima del día. */
  momento: "ahora" | "siguiente";
};

export type Retraso = {
  actividad: string;
  minutos: number;
};

export type EstudianteResumen = {
  id: string;
  nombre: string;
  /** Inicial del primer apellido, como en Figma: «Lucía M.». */
  inicialApellido: string;
  clase: string;
  actividadActual: ActividadActual | null;
  hechas: number;
  total: number;
  /** Actividad que debería haber empezado y no ha empezado (RF5.1). */
  retraso: Retraso | null;
};

export const claseDePrueba = "Aula 3";

export const estudiantesDePrueba: EstudianteResumen[] = [
  {
    id: "lucia",
    nombre: "Lucía",
    inicialApellido: "M",
    clase: "Aula 3",
    actividadActual: { titulo: "Taller de cocina", momento: "ahora" },
    hechas: 2,
    total: 6,
    retraso: null,
  },
  {
    id: "daniel",
    nombre: "Daniel",
    inicialApellido: "R",
    clase: "Aula 3",
    actividadActual: { titulo: "Música", momento: "ahora" },
    hechas: 3,
    total: 5,
    retraso: null,
  },
  {
    id: "aitana",
    nombre: "Aitana",
    inicialApellido: "G",
    clase: "Aula 3",
    actividadActual: { titulo: "Recreo", momento: "ahora" },
    hechas: 3,
    total: 5,
    retraso: null,
  },
  {
    id: "hugo",
    nombre: "Hugo",
    inicialApellido: "P",
    clase: "Aula 3",
    actividadActual: { titulo: "Fisioterapia", momento: "ahora" },
    hechas: 1,
    total: 4,
    retraso: { actividad: "Fisioterapia", minutos: 20 },
  },
  {
    id: "sara",
    nombre: "Sara",
    inicialApellido: "L",
    clase: "Aula 3",
    actividadActual: { titulo: "Recreo", momento: "ahora" },
    hechas: 3,
    total: 5,
    retraso: null,
  },
  {
    id: "mateo",
    nombre: "Mateo",
    inicialApellido: "C",
    clase: "Aula 3",
    actividadActual: { titulo: "Taller de plástica", momento: "ahora" },
    hechas: 2,
    total: 5,
    retraso: null,
  },
  // Dos alumnos de otra clase para probar el filtro por clase (GM-26): un
  // profesional como la fisio o el logopeda atiende a alumnos de varias clases.
  {
    id: "nora",
    nombre: "Nora",
    inicialApellido: "S",
    clase: "Aula 5",
    actividadActual: { titulo: "Logopedia", momento: "siguiente" },
    hechas: 2,
    total: 4,
    retraso: null,
  },
  {
    id: "iker",
    nombre: "Iker",
    inicialApellido: "B",
    clase: "Aula 5",
    actividadActual: { titulo: "Educación física", momento: "ahora" },
    hechas: 1,
    total: 5,
    retraso: { actividad: "Educación física", minutos: 10 },
  },
];
