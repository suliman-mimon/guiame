import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  requireSelfEstudiante,
  requireTutorOrAdmin,
  requireVeAlEstudianteOrAdmin,
  requireVerAgendaEstudiante,
} from "./lib/auth";

// Realizaciones (no canceladas, de actividades no canceladas) que ya tiene
// un estudiante, para comprobar solapamientos de horario (RF2.6). Se usa el
// índice by_estudiante_and_inicio para no barrer la tabla entera; el
// conjunto resultante está acotado por estudiante, igual que listarAgenda.
async function cargarHorarioActivoDelEstudiante(
  ctx: MutationCtx,
  estudianteId: Id<"estudiantes">,
): Promise<Array<{ fInicioProgramada: number; fFinProgramada: number; titulo: string }>> {
  const realizaciones = await ctx.db
    .query("realizaciones")
    .withIndex("by_estudiante_and_inicio", (q) => q.eq("estudianteId", estudianteId))
    .collect();

  const horario: Array<{
    fInicioProgramada: number;
    fFinProgramada: number;
    titulo: string;
  }> = [];
  for (const realizacion of realizaciones) {
    if (realizacion.cancelada) continue;
    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) continue;
    horario.push({
      fInicioProgramada: realizacion.fInicioProgramada,
      fFinProgramada: realizacion.fFinProgramada,
      titulo: actividad.titulo,
    });
  }
  return horario;
}

function seSolapan(
  a: { fInicioProgramada: number; fFinProgramada: number },
  b: { fInicioProgramada: number; fFinProgramada: number },
): boolean {
  // Intervalo semiabierto [inicio, fin): solapamiento total o parcial.
  return a.fInicioProgramada < b.fFinProgramada && a.fFinProgramada > b.fInicioProgramada;
}

// RF2.5 / RF2.6 (GM-07): asignar una actividad a uno o varios estudiantes,
// cada uno con su propio horario previsto y, si hace falta, una duración
// distinta de la común. Antes de confirmar nada se comprueba que ningún
// horario nuevo se solapa, total o parcialmente, con otra actividad ya en
// la agenda de ese estudiante (ni con otro horario nuevo de la misma
// llamada para el mismo estudiante). Si hay conflicto para cualquier
// estudiante se rechaza toda la operación (nada se inserta) para que el
// tutor pueda corregir el horario y volver a intentarlo.
export const asignar = mutation({
  args: {
    actividadId: v.id("actividades"),
    asignaciones: v.array(
      v.object({
        estudianteId: v.id("estudiantes"),
        fInicioProgramada: v.number(),
        fFinProgramada: v.number(),
        duracionEstudiante: v.optional(v.number()),
      }),
    ),
  },
  returns: v.array(v.id("realizaciones")),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);

    const actividad = await ctx.db.get("actividades", args.actividadId);
    if (actividad === null) {
      throw new Error("La actividad no existe");
    }
    if (actividad.creadoPor !== current.userId && !current.esAdministrador) {
      throw new Error(
        "No autorizado: solo quien creó la actividad o el administrador puede asignarla",
      );
    }

    if (args.asignaciones.length === 0) {
      throw new Error("Debes indicar al menos un estudiante");
    }

    const ahora = Date.now();

    // Paso 1: validar cada asignación y comprobar que el tutor puede ver a
    // cada estudiante, antes de tocar nada de solapamientos.
    for (const asignacion of args.asignaciones) {
      if (
        !Number.isFinite(asignacion.fInicioProgramada) ||
        !Number.isFinite(asignacion.fFinProgramada)
      ) {
        throw new Error("La fecha y hora de inicio y fin deben ser válidas");
      }
      if (asignacion.fInicioProgramada < ahora) {
        throw new Error(
          "No se puede asignar una actividad con una fecha anterior a la actual",
        );
      }
      if (asignacion.fFinProgramada <= asignacion.fInicioProgramada) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio",
        );
      }
      if (
        asignacion.duracionEstudiante !== undefined &&
        (!Number.isFinite(asignacion.duracionEstudiante) ||
          asignacion.duracionEstudiante <= 0)
      ) {
        throw new Error("La duración del estudiante debe ser un número positivo");
      }

      await requireVeAlEstudianteOrAdmin(ctx, asignacion.estudianteId);
    }

    // Paso 2 (RF2.6): comprobar solapamientos. Se lee el horario activo de
    // cada estudiante una sola vez (memorizado en este mapa) y se va
    // ampliando con cada asignación ya validada de esta misma llamada, para
    // detectar también dos horarios nuevos que se solapen entre sí.
    const horarioPorEstudiante = new Map<
      Id<"estudiantes">,
      Array<{ fInicioProgramada: number; fFinProgramada: number; titulo: string }>
    >();

    for (const asignacion of args.asignaciones) {
      let horario = horarioPorEstudiante.get(asignacion.estudianteId);
      if (horario === undefined) {
        horario = await cargarHorarioActivoDelEstudiante(ctx, asignacion.estudianteId);
        horarioPorEstudiante.set(asignacion.estudianteId, horario);
      }

      const conflicto = horario.find((existente) => seSolapan(existente, asignacion));
      if (conflicto !== undefined) {
        throw new Error(
          `No se puede asignar: el horario se solapa con "${conflicto.titulo}" en la agenda de este estudiante. Corrige el horario e inténtalo de nuevo.`,
        );
      }

      horario.push({
        fInicioProgramada: asignacion.fInicioProgramada,
        fFinProgramada: asignacion.fFinProgramada,
        titulo: actividad.titulo,
      });
    }

    // Paso 3: todas las asignaciones son válidas y no hay conflictos; se
    // insertan todas (si algo fallase aquí, la transacción de Convex
    // deshace la mutación entera, así que nunca queda una inserción a
    // medias).
    const ids: Array<Id<"realizaciones">> = [];
    for (const asignacion of args.asignaciones) {
      const realizacionId = await ctx.db.insert("realizaciones", {
        estudianteId: asignacion.estudianteId,
        actividadId: args.actividadId,
        asignadoPor: current.tutor._id,
        fInicioProgramada: asignacion.fInicioProgramada,
        fFinProgramada: asignacion.fFinProgramada,
        duracionEstudiante: asignacion.duracionEstudiante,
        cancelada: false,
      });
      ids.push(realizacionId);
    }

    return ids;
  },
});

// RF2.3: cancelar una actividad para uno o varios estudiantes. Marca las
// realizaciones correspondientes, no la actividad entera, para que siga
// visible para otros estudiantes a los que también se asignó.
export const cancelar = mutation({
  args: {
    actividadId: v.id("actividades"),
    estudianteIds: v.array(v.id("estudiantes")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);

    const actividad = await ctx.db.get("actividades", args.actividadId);
    if (actividad === null) {
      throw new Error("La actividad no existe");
    }
    if (actividad.creadoPor !== current.userId && !current.esAdministrador) {
      throw new Error(
        "No autorizado: solo quien creó la actividad o el administrador puede cancelarla",
      );
    }

    if (args.estudianteIds.length === 0) {
      throw new Error("Debes indicar al menos un estudiante");
    }

    const realizacionesDeActividad = await ctx.db
      .query("realizaciones")
      .withIndex("by_actividad", (q) => q.eq("actividadId", args.actividadId))
      .collect();

    for (const estudianteId of args.estudianteIds) {
      await requireVeAlEstudianteOrAdmin(ctx, estudianteId);

      const coincidencias = realizacionesDeActividad.filter(
        (r) => r.estudianteId === estudianteId && !r.cancelada,
      );
      for (const realizacion of coincidencias) {
        await ctx.db.patch("realizaciones", realizacion._id, {
          cancelada: true,
        });
      }
    }

    return null;
  },
});

const entradaAgenda = v.object({
  realizacionId: v.id("realizaciones"),
  actividadId: v.id("actividades"),
  titulo: v.string(),
  tipoActividad: v.union(
    v.literal("academica"),
    v.literal("profesional"),
    v.literal("familiar"),
    v.literal("del_estudiante"),
  ),
  imagenId: v.id("imagenes"),
  fInicioProgramada: v.number(),
  fFinProgramada: v.number(),
  duracionEstudiante: v.optional(v.number()),
});

// RF1.1 / RF1.2: agenda de un estudiante entre dos instantes (día o
// semana, según lo que calcule el cliente a partir de la hora local). Ya
// viene ordenada ascendentemente por el índice usado.
export const listarAgenda = query({
  args: {
    estudianteId: v.id("estudiantes"),
    inicio: v.number(),
    fin: v.number(),
  },
  returns: v.array(entradaAgenda),
  handler: async (ctx, args) => {
    await requireVerAgendaEstudiante(ctx, args.estudianteId);

    if (!Number.isFinite(args.inicio) || !Number.isFinite(args.fin)) {
      throw new Error("El rango de fechas no es válido");
    }
    if (args.fin <= args.inicio) {
      throw new Error("El fin del rango debe ser posterior al inicio");
    }

    const realizaciones = await ctx.db
      .query("realizaciones")
      .withIndex("by_estudiante_and_inicio", (q) =>
        q
          .eq("estudianteId", args.estudianteId)
          .gte("fInicioProgramada", args.inicio)
          .lt("fInicioProgramada", args.fin),
      )
      .collect();

    const resultado = [];
    for (const realizacion of realizaciones) {
      if (realizacion.cancelada) continue;
      const actividad = await ctx.db.get("actividades", realizacion.actividadId);
      if (actividad === null || actividad.cancelada) continue;
      resultado.push({
        realizacionId: realizacion._id,
        actividadId: actividad._id,
        titulo: actividad.titulo,
        tipoActividad: actividad.tipoActividad,
        imagenId: actividad.imagenId,
        fInicioProgramada: realizacion.fInicioProgramada,
        fFinProgramada: realizacion.fFinProgramada,
        duracionEstudiante: realizacion.duracionEstudiante,
      });
    }
    return resultado;
  },
});

// RF1.3: detalle de una actividad asignada (una realización concreta),
// con sus pasos en orden.
export const obtenerDetalle = query({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.union(
    v.null(),
    v.object({
      realizacionId: v.id("realizaciones"),
      titulo: v.string(),
      descripcion: v.optional(v.string()),
      imagenId: v.id("imagenes"),
      fInicioProgramada: v.number(),
      fFinProgramada: v.number(),
      pasos: v.array(
        v.object({
          orden: v.number(),
          texto: v.string(),
          tipoMedio: v.union(
            v.literal("pictograma"),
            v.literal("video"),
            v.literal("audio"),
          ),
          imagenId: v.optional(v.id("imagenes")),
          archivoId: v.optional(v.id("_storage")),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const realizacion = await ctx.db.get("realizaciones", args.realizacionId);
    if (realizacion === null) return null;

    await requireVerAgendaEstudiante(ctx, realizacion.estudianteId);

    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null) return null;

    const pasos = await ctx.db
      .query("pasos")
      .withIndex("by_actividad_and_orden", (q) =>
        q.eq("actividadId", actividad._id),
      )
      .collect();

    return {
      realizacionId: realizacion._id,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      imagenId: actividad.imagenId,
      fInicioProgramada: realizacion.fInicioProgramada,
      fFinProgramada: realizacion.fFinProgramada,
      pasos: pasos.map((paso) => ({
        orden: paso.orden,
        texto: paso.texto,
        tipoMedio: paso.tipoMedio,
        imagenId: paso.imagenId,
        archivoId: paso.archivoId,
      })),
    };
  },
});

// RF3.1 (GM-08): el propio estudiante marca cuándo empieza una actividad
// asignada. Es una acción del alumno, no del tutor: nunca se recibe el
// estudiante como argumento, se deriva de ctx.auth (requireSelfEstudiante).
export const empezar = mutation({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const estudiante = await requireSelfEstudiante(ctx);

    const realizacion = await ctx.db.get("realizaciones", args.realizacionId);
    if (realizacion === null) {
      throw new Error("La realización no existe");
    }
    if (realizacion.estudianteId !== estudiante._id) {
      throw new Error(
        "No autorizado: esta actividad no está asignada a tu cuenta",
      );
    }
    if (realizacion.cancelada) {
      throw new Error("No se puede empezar una actividad cancelada");
    }
    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) {
      throw new Error("No se puede empezar una actividad cancelada");
    }
    if (realizacion.hInicioReal !== undefined) {
      throw new Error("Esta actividad ya se había empezado");
    }

    await ctx.db.patch("realizaciones", args.realizacionId, {
      hInicioReal: Date.now(),
    });
    return null;
  },
});

// RF3.2 (GM-08): el propio estudiante marca cuándo termina una actividad
// que ya había empezado. Calcula duracionEstudiante (minutos realmente
// empleados), distinta de la duración nominal de la actividad.
export const terminar = mutation({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const estudiante = await requireSelfEstudiante(ctx);

    const realizacion = await ctx.db.get("realizaciones", args.realizacionId);
    if (realizacion === null) {
      throw new Error("La realización no existe");
    }
    if (realizacion.estudianteId !== estudiante._id) {
      throw new Error(
        "No autorizado: esta actividad no está asignada a tu cuenta",
      );
    }
    if (realizacion.cancelada) {
      throw new Error("No se puede terminar una actividad cancelada");
    }
    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) {
      throw new Error("No se puede terminar una actividad cancelada");
    }
    if (realizacion.hInicioReal === undefined) {
      throw new Error("No puedes terminar una actividad que no has empezado");
    }
    if (realizacion.hFinReal !== undefined) {
      throw new Error("Esta actividad ya se había terminado");
    }

    const hFinReal = Date.now();
    const duracionEstudiante = Math.round(
      (hFinReal - realizacion.hInicioReal) / 60000,
    );
    await ctx.db.patch("realizaciones", args.realizacionId, {
      hFinReal,
      duracionEstudiante,
    });
    return null;
  },
});
