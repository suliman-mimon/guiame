import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Nombres de tabla y de campo en español, siguiendo la terminología del
// glosario de la Propuesta Técnica (apartado 1.e) y el modelo conceptual
// entidad-relación (apartado 4.f).
//
// Esquema v2 (Sprint 2): alinea tipoActividad, paletaColor, formatos de
// lectura, permisos del alumno, multimedia en pasos y el catálogo de
// emociones con Figma y las indicaciones de la profesora (ver
// "Desajustes que hay que cerrar el lunes" en el plan de sprint).

const camposRealizacion = {
  estudianteId: v.id("estudiantes"),
  actividadId: v.id("actividades"),
  fInicioProgramada: v.number(), // fecha y hora, epoch ms
  fFinProgramada: v.number(),
  hInicioReal: v.optional(v.number()),
  hFinReal: v.optional(v.number()),
  duracionEstudiante: v.optional(v.number()), // minutos
  cancelada: v.boolean(),
  calificacion: v.optional(v.string()),
  calificadoPor: v.optional(v.id("tutores")),
};

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
  // pasos, el catálogo de emociones, usuarios y clases.
  imagenes: defineTable({
    ubicacionArchivo: v.string(),
    textoAlternativo: v.string(),
    arasaacId: v.optional(v.string()),
  }),

  // Catálogo fijo de 6 emociones con su pictograma (desajuste #6). El
  // tutor elige, por estudiante, si se muestran las 3 básicas o las 6
  // (configuracionesVisuales.rangoEmociones); "básico" son las 3
  // primeras por `orden`.
  catalogoEmociones: defineTable({
    nombre: v.string(),
    orden: v.number(),
    imagenId: v.id("imagenes"),
  }).index("by_orden", ["orden"]),

  // RI2.1. Información de actividad. El horario no se guarda aquí, sino
  // en cada realización (RI2.2), porque cada estudiante puede hacerla en
  // un día y una hora distintos.
  actividades: defineTable({
    titulo: v.string(),
    descripcion: v.optional(v.string()),
    tipoActividad: v.union(
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
  // Desajuste #5: además del pictograma, un paso puede llevar vídeo o
  // audio (archivo en Convex File Storage); vídeo y audio son P2 este
  // sprint, pero el esquema ya los admite para no bloquear más adelante.
  pasos: defineTable({
    actividadId: v.id("actividades"),
    orden: v.number(),
    texto: v.string(),
    tipoMedio: v.union(
      v.literal("pictograma"),
      v.literal("video"),
      v.literal("audio"),
    ),
    imagenId: v.optional(v.id("imagenes")),
    archivoId: v.optional(v.id("_storage")),
  }).index("by_actividad_and_orden", ["actividadId", "orden"]),

  // RI2.2. Información de realización: relación "Realiza" entre
  // Estudiante y Actividad, con su horario y seguimiento individual.
  // También guarda la calificación de RI2.6 ("Corrige") y quién la
  // asignó y quién la calificó.
  realizaciones: defineTable(
    v.union(
      v.object({
        ...camposRealizacion,
        asignadoPor: v.id("tutores"),
      }),
      v.object({
        ...camposRealizacion,
        origen: v.literal("propia"),
      }),
    ),
  )
    .index("by_estudiante_and_inicio", ["estudianteId", "fInicioProgramada"])
    .index("by_actividad", ["actividadId"]),

  // RI2.5. Información de estado emocional. Un registro por estudiante y
  // día como mucho; no representa un diagnóstico clínico. Desajuste #6:
  // referencia al catálogo de emociones en vez de un enum fijo de 3.
  estadosEmocionales: defineTable({
    estudianteId: v.id("estudiantes"),
    fechaRegistro: v.string(), // "YYYY-MM-DD"
    emocionId: v.id("catalogoEmociones"),
  }).index("by_estudiante_and_fecha", ["estudianteId", "fechaRegistro"]),

  // RI3.1. Información de configuración visual y permisos del alumno.
  // Como mucho una por estudiante.
  //
  // Desajuste #2: paletaColor con las 4 paletas con nombre de Figma (los
  // valores HEX de cada una los fija Luis fuera del esquema, con
  // contraste AA).
  // Desajuste #3: un booleano independiente por formato de lectura
  // (pictograma, texto, vídeo, audio), no las 3 combinaciones antiguas.
  // Desajuste #4: permisos del alumno (ver semana, cambiar colores,
  // decir cómo se siente, crear tareas), antes inexistentes.
  // Desajuste #6: rango de emociones que el tutor activa para este
  // alumno (básico = 3, ampliado = 6).
  configuracionesVisuales: defineTable({
    estudianteId: v.id("estudiantes"),
    paletaColor: v.union(
      v.literal("crema"),
      v.literal("alto_contraste"),
      v.literal("azul_calma"),
      v.literal("noche"),
    ),
    escalaLetra: v.union(
      v.literal("normal"),
      v.literal("grande"),
      v.literal("muy_grande"),
    ),
    mostrarPictograma: v.boolean(),
    mostrarTexto: v.boolean(),
    mostrarVideo: v.boolean(),
    mostrarAudio: v.boolean(),
    rangoEmociones: v.union(v.literal("basico"), v.literal("ampliado")),
    permiteVerSemana: v.boolean(),
    permiteCambiarColores: v.boolean(),
    permiteDecirComoSeSiente: v.boolean(),
    permiteCrearTareas: v.boolean(),
  }).index("by_estudiante", ["estudianteId"]),
});
