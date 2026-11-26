import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireSelfEstudiante } from "./lib/auth";

const MAX_DAILY_ASSIGNMENTS = 100;
const MAX_STEPS_PER_ACTIVITY = 100;

const fechaMadrid = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const horaMadrid = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const imagenAgendaValidator = v.union(
  v.null(),
  v.object({
    ubicacionArchivo: v.string(),
    textoAlternativo: v.string(),
    arasaacId: v.union(v.string(), v.null()),
  }),
);

const actividadAgendaValidator = v.object({
  realizacionId: v.id("realizaciones"),
  actividadId: v.id("actividades"),
  titulo: v.string(),
  descripcion: v.union(v.string(), v.null()),
  inicioProgramado: v.number(),
  finProgramado: v.number(),
  inicioReal: v.union(v.number(), v.null()),
  finReal: v.union(v.number(), v.null()),
  pasoActual: v.union(v.number(), v.null()),
  numeroPasos: v.number(),
  imagen: imagenAgendaValidator,
});

function parteNumerica(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) {
    throw new Error(`No se pudo calcular la fecha local (${type})`);
  }
  return Number(value);
}

function inicioDiaMadrid(year: number, month: number, day: number) {
  const utcMidnight = Date.UTC(year, month - 1, day);
  const parts = horaMadrid.formatToParts(new Date(utcMidnight));
  const localAsUtc = Date.UTC(
    parteNumerica(parts, "year"),
    parteNumerica(parts, "month") - 1,
    parteNumerica(parts, "day"),
    parteNumerica(parts, "hour"),
    parteNumerica(parts, "minute"),
    parteNumerica(parts, "second"),
  );
  return utcMidnight - (localAsUtc - utcMidnight);
}

function rangoDiaMadrid(fecha: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (match === null) {
    throw new Error("La fecha debe tener el formato YYYY-MM-DD");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error("La fecha no es válida");
  }

  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    inicio: inicioDiaMadrid(year, month, day),
    fin: inicioDiaMadrid(
      nextDay.getUTCFullYear(),
      nextDay.getUTCMonth() + 1,
      nextDay.getUTCDate(),
    ),
  };
}

function fechaLocalMadrid(timestamp: number) {
  const parts = fechaMadrid.formatToParts(new Date(timestamp));
  return `${parteNumerica(parts, "year")}-${String(
    parteNumerica(parts, "month"),
  ).padStart(2, "0")}-${String(parteNumerica(parts, "day")).padStart(2, "0")}`;
}

async function cargarPasos(
  ctx: QueryCtx | MutationCtx,
  actividadId: Id<"actividades">,
) {
  const pasos = await ctx.db
    .query("pasos")
    .withIndex("by_actividad_and_orden", (q) =>
      q.eq("actividadId", actividadId),
    )
    .take(MAX_STEPS_PER_ACTIVITY + 1);
  if (pasos.length > MAX_STEPS_PER_ACTIVITY) {
    throw new Error("La actividad excede el máximo permitido de pasos");
  }
  return pasos;
}

async function cargarRealizacionesDelDia(
  ctx: QueryCtx | MutationCtx,
  estudianteId: Id<"estudiantes">,
  fecha: string,
) {
  const { inicio, fin } = rangoDiaMadrid(fecha);
  const realizaciones = await ctx.db
    .query("realizaciones")
    .withIndex("by_estudiante_and_inicio", (q) =>
      q
        .eq("estudianteId", estudianteId)
        .gte("fInicioProgramada", inicio)
        .lt("fInicioProgramada", fin),
    )
    .take(MAX_DAILY_ASSIGNMENTS + 1);
  if (realizaciones.length > MAX_DAILY_ASSIGNMENTS) {
    throw new Error("La agenda del día excede el máximo de actividades");
  }
  return realizaciones;
}

async function actividadDeRealizacion(
  ctx: QueryCtx | MutationCtx,
  realizacion: Doc<"realizaciones">,
) {
  const actividad = await ctx.db.get("actividades", realizacion.actividadId);
  if (actividad === null || actividad.cancelada || realizacion.cancelada) {
    return null;
  }

  const [imagen, pasos] = await Promise.all([
    ctx.db.get("imagenes", actividad.imagenId),
    cargarPasos(ctx, actividad._id),
  ]);
  return { actividad, imagen, pasos };
}

async function obtenerRealizacionPropia(
  ctx: QueryCtx | MutationCtx,
  realizacionId: Id<"realizaciones">,
) {
  const estudiante = await requireSelfEstudiante(ctx);
  const realizacion = await ctx.db.get("realizaciones", realizacionId);
  if (realizacion === null) {
    throw new Error("La actividad asignada no existe");
  }
  if (realizacion.estudianteId !== estudiante._id) {
    throw new Error("No autorizado: esta actividad no está asignada a tu cuenta");
  }
  return { estudiante, realizacion };
}

export const miAgenda = query({
  args: { fecha: v.string() },
  returns: v.array(actividadAgendaValidator),
  handler: async (ctx, args) => {
    const estudiante = await requireSelfEstudiante(ctx);
    const realizaciones = await cargarRealizacionesDelDia(
      ctx,
      estudiante._id,
      args.fecha,
    );
    const actividades = [];

    for (const realizacion of realizaciones) {
      const datos = await actividadDeRealizacion(ctx, realizacion);
      if (datos === null) continue;
      actividades.push({
        realizacionId: realizacion._id,
        actividadId: datos.actividad._id,
        titulo: datos.actividad.titulo,
        descripcion: datos.actividad.descripcion ?? null,
        inicioProgramado: realizacion.fInicioProgramada,
        finProgramado: realizacion.fFinProgramada,
        inicioReal: realizacion.hInicioReal ?? null,
        finReal: realizacion.hFinReal ?? null,
        pasoActual: realizacion.pasoActual ?? null,
        numeroPasos: datos.pasos.length,
        imagen:
          datos.imagen === null
            ? null
            : {
                ubicacionArchivo: datos.imagen.ubicacionArchivo,
                textoAlternativo: datos.imagen.textoAlternativo,
                arasaacId: datos.imagen.arasaacId ?? null,
              },
      });
    }

    return actividades;
  },
});

export const obtenerDetalle = query({
  args: {
    realizacionId: v.id("realizaciones"),
    numeroPaso: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      realizacionId: v.id("realizaciones"),
      titulo: v.string(),
      descripcion: v.union(v.string(), v.null()),
      inicioProgramado: v.number(),
      finProgramado: v.number(),
      numeroPaso: v.number(),
      pasoActual: v.number(),
      totalPasos: v.number(),
      paso: v.object({
        texto: v.string(),
        tipoMedio: v.union(
          v.literal("pictograma"),
          v.literal("video"),
          v.literal("audio"),
        ),
        imagen: imagenAgendaValidator,
        archivoUrl: v.union(v.string(), v.null()),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const { realizacion } = await obtenerRealizacionPropia(
      ctx,
      args.realizacionId,
    );
    if (
      realizacion.cancelada ||
      realizacion.hInicioReal === undefined ||
      realizacion.hFinReal !== undefined ||
      !Number.isInteger(args.numeroPaso) ||
      args.numeroPaso < 1
    ) {
      return null;
    }

    const datos = await actividadDeRealizacion(ctx, realizacion);
    if (datos === null) return null;

    const pasoActual = realizacion.pasoActual ?? 1;
    if (
      args.numeroPaso > pasoActual ||
      args.numeroPaso > datos.pasos.length
    ) {
      return null;
    }

    const paso = datos.pasos[args.numeroPaso - 1];
    if (paso === undefined) return null;

    const imagen =
      paso.imagenId === undefined
        ? datos.imagen
        : await ctx.db.get("imagenes", paso.imagenId);
    const archivoUrl =
      paso.archivoId === undefined
        ? null
        : await ctx.storage.getUrl(paso.archivoId);

    return {
      realizacionId: realizacion._id,
      titulo: datos.actividad.titulo,
      descripcion: datos.actividad.descripcion ?? null,
      inicioProgramado: realizacion.fInicioProgramada,
      finProgramado: realizacion.fFinProgramada,
      numeroPaso: args.numeroPaso,
      pasoActual,
      totalPasos: datos.pasos.length,
      paso: {
        texto: paso.texto,
        tipoMedio: paso.tipoMedio ?? "pictograma",
        imagen:
          imagen === null
            ? null
            : {
                ubicacionArchivo: imagen.ubicacionArchivo,
                textoAlternativo: imagen.textoAlternativo,
                arasaacId: imagen.arasaacId ?? null,
              },
        archivoUrl,
      },
    };
  },
});

export const empezar = mutation({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { estudiante, realizacion } = await obtenerRealizacionPropia(
      ctx,
      args.realizacionId,
    );
    if (realizacion.cancelada) {
      throw new Error("No se puede empezar una actividad cancelada");
    }
    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) {
      throw new Error("No se puede empezar una actividad cancelada");
    }
    if (realizacion.hFinReal !== undefined) {
      throw new Error("Esta actividad ya se había terminado");
    }

    const fecha = fechaLocalMadrid(realizacion.fInicioProgramada);
    const delDia = await cargarRealizacionesDelDia(
      ctx,
      estudiante._id,
      fecha,
    );
    const indiceActual = delDia.findIndex(
      (item) => item._id === realizacion._id,
    );
    if (indiceActual < 0) {
      throw new Error("La actividad no está dentro de la agenda del día");
    }

    for (const item of delDia) {
      if (item.cancelada) continue;
      const otraActividad = await ctx.db.get("actividades", item.actividadId);
      if (
        otraActividad === null ||
        otraActividad.cancelada ||
        item.hInicioReal === undefined ||
        item.hFinReal !== undefined ||
        item._id === realizacion._id
      ) {
        continue;
      }
      throw new Error("Termina la actividad en curso antes de empezar otra");
    }

    for (const anterior of delDia.slice(0, indiceActual)) {
      if (anterior.cancelada || anterior.hFinReal !== undefined) continue;
      const actividadAnterior = await ctx.db.get(
        "actividades",
        anterior.actividadId,
      );
      if (actividadAnterior !== null && !actividadAnterior.cancelada) {
        throw new Error("Completa la actividad anterior antes de continuar");
      }
    }

    if (realizacion.hInicioReal !== undefined) return null;

    await ctx.db.patch("realizaciones", realizacion._id, {
      hInicioReal: Date.now(),
      pasoActual: 1,
    });
    return null;
  },
});

export const avanzarPaso = mutation({
  args: {
    realizacionId: v.id("realizaciones"),
    numeroPaso: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { realizacion } = await obtenerRealizacionPropia(
      ctx,
      args.realizacionId,
    );
    if (
      realizacion.cancelada ||
      realizacion.hInicioReal === undefined ||
      realizacion.hFinReal !== undefined
    ) {
      throw new Error("La actividad no está en curso");
    }

    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) {
      throw new Error("No se puede avanzar en una actividad cancelada");
    }
    const pasos = await cargarPasos(ctx, actividad._id);
    const pasoActual = realizacion.pasoActual ?? 1;
    if (args.numeroPaso !== pasoActual) {
      throw new Error("Completa el paso actual antes de continuar");
    }
    if (pasoActual >= pasos.length) {
      throw new Error("Ya estás en el último paso");
    }

    await ctx.db.patch("realizaciones", realizacion._id, {
      pasoActual: pasoActual + 1,
    });
    return null;
  },
});

export const terminar = mutation({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { realizacion } = await obtenerRealizacionPropia(
      ctx,
      args.realizacionId,
    );
    if (realizacion.cancelada) {
      throw new Error("No se puede terminar una actividad cancelada");
    }
    if (
      realizacion.hInicioReal === undefined ||
      realizacion.hFinReal !== undefined
    ) {
      throw new Error("La actividad no está en curso");
    }

    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null || actividad.cancelada) {
      throw new Error("No se puede terminar una actividad cancelada");
    }
    const pasos = await cargarPasos(ctx, actividad._id);
    if (
      pasos.length > 0 &&
      (realizacion.pasoActual ?? 1) !== pasos.length
    ) {
      throw new Error("Completa todos los pasos antes de terminar");
    }

    const hFinReal = Date.now();
    await ctx.db.patch("realizaciones", realizacion._id, {
      hFinReal,
      duracionEstudiante: Math.max(
        0,
        Math.round((hFinReal - realizacion.hInicioReal) / 60000),
      ),
    });
    return null;
  },
});
