import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Nombres de tabla y de campo en español, siguiendo la terminología del
// glosario de la Propuesta Técnica (apartado 1.e) y el modelo conceptual
// entidad-relación (apartado 4.f). Las tres paletas de RI3.1 todavía no
// tienen nombre ni valores HEX definidos (eso es la tarea A1 de la
// iteración 1), así que se guardan como placeholders "paleta_1/2/3".

export default defineSchema({
  ...authTables,

  // RI1.1. Información de usuario. Extiende la tabla "users" de Convex
  // Auth (que ya guarda email, name, etc.) con los atributos que pide el
  // modelo conceptual. Las contraseñas las gestiona Convex Auth aparte,
  // nunca se guardan aquí.
  users: defineTable({
    ...authTables.users.validator.fields,
    apellidos: v.optional(v.string()),
    roles: v.optional(
      v.array(
        v.union(
          v.literal("tutor"),
          v.literal("estudiante"),
          v.literal("administrador"),
        ),
      ),
    ),
    estadoCuenta: v.optional(
      v.union(v.literal("activo"), v.literal("inactivo")),
    ),
    imagenId: v.optional(v.id("imagenes")),
  }).index("email", ["email"]),

  // RI1.2. Información de tutor.
  tutores: defineTable({
    userId: v.id("users"),
    esFamiliar: v.boolean(),
  }).index("by_userId", ["userId"]),

  // RI1.3. Información de estudiante. idEstudiante es el _id del
  // documento; el resto de datos comunes vienen de "users".
  estudiantes: defineTable({
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  // RI1.4. Información de clase. "Clase" es siempre un grupo de
  // estudiantes, nunca un espacio físico.
  clases: defineTable({
    nombre: v.string(),
    imagenId: v.optional(v.id("imagenes")),
  }),

  // Relación "Supervisa": un tutor supervisa una o varias clases en un
  // curso académico.
  supervisiones: defineTable({
    tutorId: v.id("tutores"),
    claseId: v.id("clases"),
    anioCursoAcademico: v.string(),
  })
    .index("by_tutor", ["tutorId"])
    .index("by_clase_and_anio", ["claseId", "anioCursoAcademico"]),

  // Relación "Matriculado": un estudiante se matricula en una o varias
  // clases por curso académico. Se conservan las matrículas anteriores.
  matriculas: defineTable({
    estudianteId: v.id("estudiantes"),
    claseId: v.id("clases"),
    anioCursoAcademico: v.string(),
  })
    .index("by_estudiante", ["estudianteId"])
    .index("by_clase_and_anio", ["claseId", "anioCursoAcademico"]),

  // Relación "Dispone": un tutor (típicamente familiar) puede tener
  // estudiantes asignados directamente, sin pasar por una clase.
  vinculosDirectos: defineTable({
    tutorId: v.id("tutores"),
    estudianteId: v.id("estudiantes"),
  })
    .index("by_tutor", ["tutorId"])
    .index("by_estudiante", ["estudianteId"]),

  // RI2.4. Información de imagen o pictograma. Usada por actividades,
  // pasos, el catálogo de estados emocionales, usuarios y clases.
  imagenes: defineTable({
    ubicacionArchivo: v.string(),
    textoAlternativo: v.string(),
    arasaacId: v.optional(v.string()),
  }),

  // RI2.1. Información de actividad. El horario no se guarda aquí, sino
  // en cada realización (RI2.2), porque cada estudiante puede hacerla en
  // un día y una hora distintos.
  actividades: defineTable({
    titulo: v.string(),
    descripcion: v.optional(v.string()),
    tipoActividad: v.union(
      v.literal("personal"),
      v.literal("reprografia"),
      v.literal("comedor"),
      v.literal("menu_mensual"),
      v.literal("guia_de_visita"),
      v.literal("academica"),
      v.literal("profesional"),
      v.literal("familiar"),
      v.literal("del_estudiante"),
    ),
    duracion: v.optional(v.number()), // minutos, si siempre dura lo mismo
    imagenId: v.id("imagenes"),
    creadoPor: v.id("users"),
    cancelada: v.boolean(),
  }).index("by_creadoPor", ["creadoPor"]),

  // RI2.3. Información de paso. Toda actividad tiene al menos un paso.
  pasos: defineTable({
    actividadId: v.id("actividades"),
    orden: v.number(),
    texto: v.string(),
    tipoMedio: v.optional(
      v.union(
        v.literal("pictograma"),
        v.literal("video"),
        v.literal("audio"),
      ),
    ),
    imagenId: v.optional(v.id("imagenes")),
    archivoId: v.optional(v.id("_storage")),
  }).index("by_actividad_and_orden", ["actividadId", "orden"]),

  // RI2.2. Información de realización: relación "Realiza" entre
  // Estudiante y Actividad, con su horario y seguimiento individual.
  // También guarda la calificación de RI2.6 ("Corrige") y quién la
  // asignó y quién la calificó.
  realizaciones: defineTable({
    estudianteId: v.id("estudiantes"),
    actividadId: v.id("actividades"),
    asignadoPor: v.id("tutores"),
    fInicioProgramada: v.number(), // fecha y hora, epoch ms
    fFinProgramada: v.number(),
    hInicioReal: v.optional(v.number()),
    hFinReal: v.optional(v.number()),
    pasoActual: v.optional(v.number()),
    duracionEstudiante: v.optional(v.number()), // minutos
    cancelada: v.boolean(),
    calificacion: v.optional(v.string()),
    calificadoPor: v.optional(v.id("tutores")),
  })
    .index("by_estudiante_and_inicio", ["estudianteId", "fInicioProgramada"])
    .index("by_actividad", ["actividadId"]),

  // RI2.5. Información de estado emocional. Un registro por estudiante y
  // día como mucho; no representa un diagnóstico clínico.
  estadosEmocionales: defineTable({
    estudianteId: v.id("estudiantes"),
    fechaRegistro: v.string(), // "YYYY-MM-DD"
    emocionSeleccionada: v.union(
      v.literal("insatisfecho"),
      v.literal("medio_satisfecho"),
      v.literal("muy_satisfecho"),
    ),
  }).index("by_estudiante_and_fecha", ["estudianteId", "fechaRegistro"]),

  // RI3.1. Información de configuración visual. Como mucho una por
  // estudiante; valores por defecto: primera paleta, tamaño normal,
  // botones/texto/pictogramas visibles.
  configuracionesVisuales: defineTable({
    estudianteId: v.id("estudiantes"),
    paletaColor: v.union(
      v.literal("paleta_1"),
      v.literal("paleta_2"),
      v.literal("paleta_3"),
    ),
    escalaLetra: v.union(
      v.literal("normal"),
      v.literal("grande"),
      v.literal("muy_grande"),
    ),
    mostrarBotones: v.boolean(),
    mostrarTexto: v.boolean(),
    mostrarPictogramas: v.boolean(),
  }).index("by_estudiante", ["estudianteId"]),
});
