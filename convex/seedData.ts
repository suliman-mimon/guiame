// Identidades ficticias. Para el alumnado solo se conoce la inicial del boceto.
export const estudiantesDemo = [
  { usuario: "lucia", nombre: "Lucía", apellidos: "M" },
  { usuario: "daniel", nombre: "Daniel", apellidos: "R" },
  { usuario: "aitana", nombre: "Aitana", apellidos: "G" },
  { usuario: "hugo", nombre: "Hugo", apellidos: "P" },
  { usuario: "sara", nombre: "Sara", apellidos: "L" },
  { usuario: "mateo", nombre: "Mateo", apellidos: "C" },
] as const;

export const pictogramas = {
  leer: ["7141", "Leer"],
  matematicas: ["32554", "Matemáticas"],
  musica: ["24791", "Música"],
  cocinar: ["2342", "Cocinar"],
  plastica: ["7794", "Plástica"],
  recreo: ["33064", "Recreo"],
  manos: ["8977", "Lavarse las manos"],
  deporte: ["31945", "Educación física"],
  comunicacion: ["9870", "Comunicación"],
  fisioterapia: ["5998", "Fisioterapia"],
} as const;

type Pictograma = keyof typeof pictogramas;
type Actividad = {
  titulo: string;
  tipo: "academica" | "profesional" | "familiar";
  minutos: number;
  imagen: Pictograma;
  pasos: Array<[texto: string, imagen: Pictograma]>;
};

export const actividadesDemo = {
  lectura: { titulo: "Lectura acompañada", tipo: "academica", minutos: 30, imagen: "leer",
    pasos: [["Elige un cuento", "leer"], ["Lee la primera página con tu tutora", "leer"]] },
  mates: { titulo: "Matemáticas con fichas", tipo: "academica", minutos: 35, imagen: "matematicas",
    pasos: [["Cuenta las fichas", "matematicas"], ["Forma grupos de cinco", "matematicas"]] },
  musica: { titulo: "Música", tipo: "academica", minutos: 30, imagen: "musica",
    pasos: [["Escucha el ritmo", "musica"], ["Repite el ritmo con las palmas", "musica"]] },
  cocina: { titulo: "Preparar una merienda", tipo: "familiar", minutos: 35, imagen: "cocinar",
    pasos: [["Lávate las manos", "manos"], ["Prepara los ingredientes", "cocinar"],
      ["Prepara la merienda con ayuda", "cocinar"], ["Recoge los materiales", "cocinar"]] },
  plastica: { titulo: "Taller de plástica", tipo: "academica", minutos: 40, imagen: "plastica",
    pasos: [["Elige los colores", "plastica"], ["Pinta tu dibujo", "plastica"]] },
  recreo: { titulo: "Recreo", tipo: "academica", minutos: 20, imagen: "recreo",
    pasos: [["Sal al patio con tu clase", "recreo"]] },
  higiene: { titulo: "Higiene personal", tipo: "familiar", minutos: 15, imagen: "manos",
    pasos: [["Enjabónate las manos", "manos"], ["Aclara y seca las manos", "manos"]] },
  deporte: { titulo: "Educación física", tipo: "academica", minutos: 40, imagen: "deporte",
    pasos: [["Calienta con tu clase", "deporte"], ["Haz el circuito", "deporte"]] },
  comunicacion: { titulo: "Taller de comunicación", tipo: "profesional", minutos: 25, imagen: "comunicacion",
    pasos: [["Elige un pictograma para saludar", "comunicacion"], ["Espera tu turno y saluda", "comunicacion"]] },
  fisio: { titulo: "Fisioterapia", tipo: "profesional", minutos: 30, imagen: "fisioterapia",
    pasos: [["Prepara la colchoneta", "fisioterapia"], ["Haz los ejercicios con el profesional", "fisioterapia"]] },
} satisfies Record<string, Actividad>;

type Sesion = [
  dia: number, hora: string, estudiante: number, actividad: keyof typeof actividadesDemo,
  estado?: "hecha" | "en_curso",
];

// 11:30–12:30 del viernes queda libre para crear y asignar el taller en directo.
// El jueves sirve para ensayar el mismo hueco. Hugo tiene una sesión sin inicio.
export const sesionesDemo: Sesion[] = [
  [23, "09:00", 0, "lectura", "hecha"], [23, "09:30", 1, "mates", "hecha"],
  [23, "10:00", 2, "musica", "hecha"], [23, "11:00", 3, "recreo", "hecha"],
  [23, "14:00", 4, "higiene", "hecha"],
  [24, "09:00", 5, "comunicacion", "hecha"], [24, "09:45", 0, "mates", "hecha"],
  [24, "11:00", 1, "recreo", "hecha"], [24, "12:00", 2, "plastica", "hecha"],
  [24, "14:00", 3, "deporte", "hecha"],
  [25, "09:00", 4, "lectura", "hecha"], [25, "10:00", 5, "musica", "hecha"],
  [25, "11:00", 0, "recreo", "hecha"], [25, "12:30", 1, "cocina", "hecha"],
  [25, "14:00", 2, "comunicacion", "hecha"],
  [26, "09:00", 0, "lectura", "hecha"], [26, "09:45", 1, "mates", "hecha"],
  [26, "10:30", 3, "fisio"], [26, "11:15", 2, "musica", "en_curso"],
  [26, "14:00", 5, "deporte"],
  [27, "09:00", 0, "lectura", "hecha"], [27, "09:45", 1, "mates", "hecha"],
  [27, "10:30", 3, "fisio"], [27, "11:15", 2, "musica", "en_curso"],
  [27, "14:00", 4, "plastica"],
];

export function horarioDemo(dia: number, hora: string, minutos: number) {
  // Durante toda la semana del 23–27 de noviembre Madrid está en UTC+01:00.
  const inicio = Date.parse(`2026-11-${dia}T${hora}:00+01:00`);
  return { inicio, fin: inicio + minutos * 60000 };
}
