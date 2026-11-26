import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { crearActividad } from "./actividades";
import { cargarConfiguracion } from "./configuracionesVisuales";
import { requireSelfEstudiante } from "./lib/auth";
import { cargarHorarioActivoDelEstudiante, seSolapan } from "./realizaciones";
import {
  DURACION_TAREA_PROPIA,
  MAX_TITULO_TAREA,
} from "../src/lib/tareaPropia";

async function estudianteConPermiso(ctx: QueryCtx | MutationCtx) {
  const estudiante = await requireSelfEstudiante(ctx);
  const cuenta = await ctx.db.get("users", estudiante.userId);
  const configuracion = await cargarConfiguracion(ctx, estudiante._id);
  return cuenta &&
    cuenta.estadoCuenta !== "inactivo" &&
    configuracion?.permiteCrearTareas
    ? estudiante
    : null;
}

export const catalogo = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("imagenes"),
      nombre: v.string(),
      arasaacId: v.string(),
    }),
  ),
  handler: async (ctx) => {
    if (!(await estudianteConPermiso(ctx))) return [];
    const imagenes = await ctx.db.query("imagenes").take(500);
    const catalogo = new Map<
      string,
      { id: Id<"imagenes">; nombre: string; arasaacId: string }
    >();
    for (const { _id, arasaacId, textoAlternativo } of imagenes) {
      if (arasaacId && /^\d+$/.test(arasaacId) && !catalogo.has(arasaacId)) {
        catalogo.set(arasaacId, {
          id: _id,
          nombre: textoAlternativo,
          arasaacId,
        });
      }
    }
    return [...catalogo.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
  },
});

export const crear = mutation({
  args: {
    titulo: v.string(),
    imagenId: v.id("imagenes"),
    fInicioProgramada: v.number(),
  },
  returns: v.id("realizaciones"),
  handler: async (ctx, { titulo: entrada, imagenId, fInicioProgramada }) => {
    const estudiante = await estudianteConPermiso(ctx);
    if (!estudiante)
      throw new ConvexError("Tu cuenta no tiene permiso para crear tareas.");
    const titulo = entrada.trim();
    if (!titulo || titulo.length > MAX_TITULO_TAREA) {
      throw new ConvexError(
        `Escribe un título de 1 a ${MAX_TITULO_TAREA} caracteres.`,
      );
    }
    const fFinProgramada = fInicioProgramada + DURACION_TAREA_PROPIA * 60_000;
    if (
      !Number.isSafeInteger(fInicioProgramada) ||
      fInicioProgramada % 60_000 !== 0 ||
      fInicioProgramada <= Date.now() ||
      fFinProgramada > 8.64e15
    ) {
      throw new ConvexError("Elige una fecha y una hora futuras.");
    }

    const imagen = await ctx.db.get("imagenes", imagenId);
    if (!imagen?.arasaacId || !/^\d+$/.test(imagen.arasaacId)) {
      throw new ConvexError("Elige un pictograma del catálogo.");
    }
    const horario = { fInicioProgramada, fFinProgramada };
    const ocupadas = await cargarHorarioActivoDelEstudiante(
      ctx,
      estudiante._id,
    );
    if (ocupadas.some((actividad) => seSolapan(actividad, horario))) {
      throw new ConvexError(
        "Ya tienes una actividad a esa hora. Elige otra hora.",
      );
    }
    const actividadId = await crearActividad(ctx, estudiante.userId, {
      titulo,
      tipoActividad: "del_estudiante",
      duracion: DURACION_TAREA_PROPIA,
      imagenId,
      pasos: [{ texto: titulo, tipoMedio: "pictograma", imagenId }],
    });
    return await ctx.db.insert("realizaciones", {
      estudianteId: estudiante._id,
      actividadId,
      origen: "propia",
      ...horario,
      cancelada: false,
    });
  },
});
