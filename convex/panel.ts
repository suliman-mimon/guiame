import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  requireTutorOrAdmin,
  requireVeAlEstudianteOrAdmin,
  type CurrentUser,
} from "./lib/auth";
import { imagenValidator } from "./imagenes";

// Consultas del panel del profesional (W2 «Mis estudiantes» y W3 «Agenda del
// estudiante»): GM-15 y GM-16. Devuelven datos «en bruto» (fechas en epoch ms)
// y la pantalla calcula con la hora actual qué va «ahora», qué va con retraso
// y el progreso, para que la consulta no dependa del reloj y se pueda cachear.
//
// El día lo decide el cliente (inicio y fin en ms, en hora de Madrid), porque
// el servidor trabaja en UTC.

type Tutor = CurrentUser & { kind: "tutor" };

const realizacionDelDia = v.object({
  id: v.id("realizaciones"),
  titulo: v.string(),
  fInicioProgramada: v.number(),
  fFinProgramada: v.number(),
  hInicioReal: v.optional(v.number()),
  hFinReal: v.optional(v.number()),
});

const datosEstudiante = {
  id: v.id("estudiantes"),
  nombre: v.string(),
  apellidos: v.string(),
  clase: v.union(v.string(), v.null()),
};

const medioValidator = v.union(
  v.literal("pictograma"),
  v.literal("video"),
  v.literal("audio"),
);

// Clase del curso más reciente en el que está matriculado el estudiante.
async function claseActual(
  ctx: QueryCtx,
  estudianteId: Id<"estudiantes">,
): Promise<string | null> {
  const matriculas = await ctx.db
    .query("matriculas")
    .withIndex("by_estudiante", (q) => q.eq("estudianteId", estudianteId))
    .collect();
  if (matriculas.length === 0) return null;
  const ultima = matriculas.reduce((a, b) =>
    b.anioCursoAcademico > a.anioCursoAcademico ? b : a,
  );
  const clase = await ctx.db.get("clases", ultima.claseId);
  return clase?.nombre ?? null;
}

// Estudiantes que ve el tutor (RF6.2, RF6.3): los matriculados en las clases
// que supervisa, en el curso de cada supervisión, y los que tiene por vínculo
// directo. El administrador ve a todos. Devuelve cada uno con su clase.
async function estudiantesVisibles(
  ctx: QueryCtx,
  current: Tutor,
): Promise<Map<Id<"estudiantes">, string | null>> {
  const visibles = new Map<Id<"estudiantes">, string | null>();

  if (current.esAdministrador) {
    for (const estudiante of await ctx.db.query("estudiantes").take(500)) {
      visibles.set(estudiante._id, await claseActual(ctx, estudiante._id));
    }
    return visibles;
  }

  const supervisiones = await ctx.db
    .query("supervisiones")
    .withIndex("by_tutor", (q) => q.eq("tutorId", current.tutor._id))
    .collect();
  for (const supervision of supervisiones) {
    const clase = await ctx.db.get("clases", supervision.claseId);
    const matriculas = await ctx.db
      .query("matriculas")
      .withIndex("by_clase_and_anio", (q) =>
        q.eq("claseId", supervision.claseId).eq("anioCursoAcademico", supervision.anioCursoAcademico),
      )
      .collect();
    for (const matricula of matriculas) {
      if (!visibles.has(matricula.estudianteId)) {
        visibles.set(matricula.estudianteId, clase?.nombre ?? null);
      }
    }
  }

  const vinculos = await ctx.db
    .query("vinculosDirectos")
    .withIndex("by_tutor", (q) => q.eq("tutorId", current.tutor._id))
    .collect();
  for (const vinculo of vinculos) {
    if (!visibles.has(vinculo.estudianteId)) {
      visibles.set(vinculo.estudianteId, await claseActual(ctx, vinculo.estudianteId));
    }
  }

  return visibles;
}

// Realizaciones de un estudiante que empiezan en [inicio, fin), sin las
// canceladas ni las de actividades canceladas, en orden de hora.
async function realizacionesEntre(
  ctx: QueryCtx,
  estudianteId: Id<"estudiantes">,
  inicio: number,
  fin: number,
): Promise<Array<{ realizacion: Doc<"realizaciones">; actividad: Doc<"actividades"> }>> {
  const realizaciones = await ctx.db
    .query("realizaciones")
    .withIndex("by_estudiante_and_inicio", (q) =>
      q.eq("estudianteId", estudianteId).gte("fInicioProgramada", inicio).lt("fInicioProgramada", fin),
    )
    .collect();
  const resultado = [];
  for (const realizacion of realizaciones) {
    if (realizacion.cancelada) continue;
    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) continue;
    resultado.push({ realizacion, actividad });
  }
  return resultado;
}

async function nombreDe(
  ctx: QueryCtx,
  estudiante: Doc<"estudiantes">,
): Promise<{ nombre: string; apellidos: string }> {
  const user = await ctx.db.get("users", estudiante.userId);
  return { nombre: user?.name ?? "Sin nombre", apellidos: user?.apellidos ?? "" };
}

// Clases que supervisa el tutor, para la barra lateral del panel.
export const misClases = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const current = await requireTutorOrAdmin(ctx);
    const supervisiones = await ctx.db
      .query("supervisiones")
      .withIndex("by_tutor", (q) => q.eq("tutorId", current.tutor._id))
      .collect();
    const nombres = new Set<string>();
    for (const supervision of supervisiones) {
      const clase = await ctx.db.get("clases", supervision.claseId);
      if (clase !== null) nombres.add(clase.nombre);
    }
    return [...nombres].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  },
});

// GM-15 · W2 «Mis estudiantes»: los estudiantes del tutor con sus actividades
// del día, para calcular el progreso, qué hacen ahora y los retrasos (RF5.1).
export const misEstudiantes = query({
  args: { inicio: v.number(), fin: v.number() },
  returns: v.array(v.object({ ...datosEstudiante, realizaciones: v.array(realizacionDelDia) })),
  handler: async (ctx, { inicio, fin }) => {
    const current = await requireTutorOrAdmin(ctx);
    const visibles = await estudiantesVisibles(ctx, current);

    const resultado = [];
    for (const [estudianteId, clase] of visibles) {
      const estudiante = await ctx.db.get("estudiantes", estudianteId);
      if (estudiante === null) continue;
      const { nombre, apellidos } = await nombreDe(ctx, estudiante);
      const delDia = await realizacionesEntre(ctx, estudianteId, inicio, fin);
      resultado.push({
        id: estudianteId,
        nombre,
        apellidos,
        clase,
        realizaciones: delDia.map(({ realizacion, actividad }) => ({
          id: realizacion._id,
          titulo: actividad.titulo,
          fInicioProgramada: realizacion.fInicioProgramada,
          fFinProgramada: realizacion.fFinProgramada,
          hInicioReal: realizacion.hInicioReal,
          hFinReal: realizacion.hFinReal,
        })),
      });
    }
    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  },
});

// GM-16 · W3 «Agenda del estudiante»: sus actividades del día con pictograma,
// formatos de los pasos y estado, y cómo dijo que se sentía (RF3.3). Devuelve
// null si el estudiante no existe o el tutor no lo puede ver.
export const agendaDeEstudiante = query({
  args: {
    estudianteId: v.string(),
    inicio: v.number(),
    fin: v.number(),
    /** "YYYY-MM-DD" en hora de Madrid, para el estado emocional del día. */
    fecha: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      estudiante: v.object(datosEstudiante),
      actividades: v.array(
        v.object({
          id: v.id("realizaciones"),
          actividadId: v.id("actividades"),
          titulo: v.string(),
          fInicioProgramada: v.number(),
          fFinProgramada: v.number(),
          hInicioReal: v.optional(v.number()),
          hFinReal: v.optional(v.number()),
          imagen: v.union(imagenValidator, v.null()),
          medios: v.array(medioValidator),
        }),
      ),
      emocion: v.union(v.null(), v.object({ nombre: v.string(), hora: v.number() })),
    }),
  ),
  handler: async (ctx, args) => {
    const estudianteId = ctx.db.normalizeId("estudiantes", args.estudianteId);
    if (estudianteId === null) return null;
    try {
      await requireVeAlEstudianteOrAdmin(ctx, estudianteId);
    } catch {
      return null;
    }
    const estudiante = await ctx.db.get("estudiantes", estudianteId);
    if (estudiante === null) return null;
    const { nombre, apellidos } = await nombreDe(ctx, estudiante);

    const actividades = [];
    for (const { realizacion, actividad } of await realizacionesEntre(
      ctx,
      estudianteId,
      args.inicio,
      args.fin,
    )) {
      const imagen = await ctx.db.get("imagenes", actividad.imagenId);
      const pasos = await ctx.db
        .query("pasos")
        .withIndex("by_actividad_and_orden", (q) => q.eq("actividadId", actividad._id))
        .collect();
      actividades.push({
        id: realizacion._id,
        actividadId: actividad._id,
        titulo: actividad.titulo,
        fInicioProgramada: realizacion.fInicioProgramada,
        fFinProgramada: realizacion.fFinProgramada,
        hInicioReal: realizacion.hInicioReal,
        hFinReal: realizacion.hFinReal,
        imagen:
          imagen === null
            ? null
            : {
                _id: imagen._id,
                textoAlternativo: imagen.textoAlternativo,
                ubicacionArchivo: imagen.ubicacionArchivo,
                arasaacId: imagen.arasaacId,
              },
        medios: pasos.map((p) => p.tipoMedio),
      });
    }

    const registro = await ctx.db
      .query("estadosEmocionales")
      .withIndex("by_estudiante_and_fecha", (q) =>
        q.eq("estudianteId", estudianteId).eq("fechaRegistro", args.fecha),
      )
      .first();
    const emocion = registro === null ? null : await ctx.db.get("catalogoEmociones", registro.emocionId);

    return {
      estudiante: {
        id: estudianteId,
        nombre,
        apellidos,
        clase: await claseActual(ctx, estudianteId),
      },
      actividades,
      emocion:
        registro === null || emocion === null
          ? null
          : { nombre: emocion.nombre, hora: registro._creationTime },
    };
  },
});

// W4 «Nueva actividad», paso «Para quién»: qué tienen ya en la agenda ese día
// los estudiantes elegidos, para avisar de solapamientos antes de guardar
// (RF2.6). El servidor lo vuelve a comprobar al asignar (realizaciones.asignar).
export const ocupacion = query({
  args: { estudianteIds: v.array(v.string()), inicio: v.number(), fin: v.number() },
  returns: v.array(
    v.object({
      estudianteId: v.id("estudiantes"),
      realizaciones: v.array(
        v.object({
          id: v.id("realizaciones"),
          titulo: v.string(),
          fInicioProgramada: v.number(),
          fFinProgramada: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);
    const visibles = await estudiantesVisibles(ctx, current);
    const resultado = [];
    for (const texto of args.estudianteIds) {
      const estudianteId = ctx.db.normalizeId("estudiantes", texto);
      if (estudianteId === null || !visibles.has(estudianteId)) continue;
      const delDia = await realizacionesEntre(ctx, estudianteId, args.inicio, args.fin);
      resultado.push({
        estudianteId,
        realizaciones: delDia.map(({ realizacion, actividad }) => ({
          id: realizacion._id,
          titulo: actividad.titulo,
          fInicioProgramada: realizacion.fInicioProgramada,
          fFinProgramada: realizacion.fFinProgramada,
        })),
      });
    }
    return resultado;
  },
});
