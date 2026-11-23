// Datos de prueba de W2 «Mis estudiantes», copiados de los bocetos de Figma.
//
// La consulta real (GM-15, Ignacio) debe devolver objetos con esta misma forma,
// `EstudianteResumen`, para que la pantalla se conecte sin cambiar nada más:
// se sustituye `estudiantesDePrueba` por `useQuery(api.panel.misEstudiantes, ...)`.
//
// De dónde sale cada campo en el esquema v2 (los alumnos que el tutor ve son los
// de sus `supervisiones` → `matriculas` del curso, más sus `vinculosDirectos`):
//   estudiantes._id → id · users.name → nombre · users.apellidos → inicialApellido
//   clases.nombre (matrícula del curso actual) → clase
//   realizaciones de hoy sin cancelar → hechas (con hFinReal) y total
//   la primera sin hFinReal → actividadActual («ahora» si ya ha empezado su franja)
//   la primera con fInicioProgramada pasada y sin hInicioReal → retraso
//     (minutos = ahora − fInicioProgramada)

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
];
