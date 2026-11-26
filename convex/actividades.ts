import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireTutorOrAdmin } from "./lib/auth";

// RF2.1 / RF2.4 / RF2.7: crear una actividad (personal de un tutor, o del
// centro si la crea el administrador) con su pictograma y, al menos, un
// paso. El horario se fija al asignarla (RF2.5), no aquí.
export const crear = mutation({
  args: {
    titulo: v.string(),
    descripcion: v.optional(v.string()),
    tipoActividad: v.union(
      v.literal("academica"),
      v.literal("profesional"),
      v.literal("familiar"),
      v.literal("del_estudiante"),
    ),
    duracion: v.optional(v.number()),
    imagenId: v.id("imagenes"),
    pasos: v.array(
      v.object({
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
  },
  returns: v.id("actividades"),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);

    const titulo = args.titulo.trim();
    if (titulo.length === 0) {
      throw new Error("Falta el título de la actividad");
    }
    if (args.pasos.length === 0) {
      throw new Error("La actividad debe tener al menos un paso");
    }
    for (const [index, paso] of args.pasos.entries()) {
      if (paso.texto.trim().length === 0) {
        throw new Error(`Falta el texto del paso ${index + 1}`);
      }
    }
    if (args.duracion !== undefined) {
      if (!Number.isFinite(args.duracion) || args.duracion <= 0) {
        throw new Error("La duración común debe ser un número positivo");
      }
    }

    const actividadId = await ctx.db.insert("actividades", {
      titulo,
      descripcion: args.descripcion,
      tipoActividad: args.tipoActividad,
      duracion: args.duracion,
      imagenId: args.imagenId,
      creadoPor: current.userId,
      cancelada: false,
    });

    for (const [index, paso] of args.pasos.entries()) {
      await ctx.db.insert("pasos", {
        actividadId,
        orden: index,
        texto: paso.texto.trim(),
        tipoMedio: paso.tipoMedio,
        imagenId: paso.imagenId,
        archivoId: paso.archivoId,
      });
    }

    return actividadId;
  },
});
