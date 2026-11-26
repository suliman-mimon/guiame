import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireTutorOrAdmin } from "./lib/auth";

const tipoMedioValidator = v.union(
  v.literal("pictograma"),
  v.literal("video"),
  v.literal("audio"),
);

// GM-12 (desajuste #5, revisión de Pablo en el #15): todo paso lleva su
// pictograma (imagenId es obligatorio siempre, con o sin alumno con vídeo o
// audio activado); el de vídeo o audio lleva además su archivoId. Se usa
// tanto en crear como en modificar para que las dos rutas validen igual.
function validarMedioDePaso(
  paso: {
    tipoMedio: "pictograma" | "video" | "audio";
    imagenId?: Id<"imagenes">;
    archivoId?: Id<"_storage">;
  },
  index: number,
): void {
  if (paso.imagenId === undefined) {
    throw new Error(`El paso ${index + 1}: falta el pictograma (imagenId)`);
  }
  if (paso.tipoMedio === "pictograma") {
    if (paso.archivoId !== undefined) {
      throw new Error(
        `El paso ${index + 1} es de tipo pictograma: no debe llevar archivoId`,
      );
    }
  } else if (paso.archivoId === undefined) {
    throw new Error(
      `El paso ${index + 1} es de tipo ${paso.tipoMedio}: falta archivoId`,
    );
  }
}

const pasoEntradaValidator = v.object({
  texto: v.string(),
  tipoMedio: tipoMedioValidator,
  imagenId: v.id("imagenes"),
  archivoId: v.optional(v.id("_storage")),
});

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
    pasos: v.array(pasoEntradaValidator),
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
      validarMedioDePaso(paso, index);
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

// RF2.2 / RF2.7: modificar título, descripción, duración, pictograma y/o
// pasos de una actividad ya creada. Solo quien la creó, o el administrador,
// puede hacerlo. No se puede modificar una actividad que algún estudiante ya
// haya completado (RF2.2). Si se envían `pasos`, se sustituye la lista
// entera (se borran los pasos actuales y se insertan los nuevos en el orden
// recibido): es la forma más simple de admitir "añadir, reordenar o
// eliminar" pasos en una sola llamada, con la lista completa como única
// fuente de verdad. Si no se envían `pasos`, los pasos existentes no se
// tocan. El horario de cada estudiante se cambia aparte, con
// realizaciones.reprogramar (RF2.5/RF2.6).
export const modificar = mutation({
  args: {
    actividadId: v.id("actividades"),
    titulo: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    duracion: v.optional(v.number()),
    imagenId: v.optional(v.id("imagenes")),
    pasos: v.optional(v.array(pasoEntradaValidator)),
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
        "No autorizado: solo quien creó la actividad o el administrador puede modificarla",
      );
    }

    // RF2.2: no se puede modificar una actividad que algún estudiante ya
    // haya completado. Se comprueba contra todas sus realizaciones no
    // canceladas (mismo índice by_actividad que ya usa cancelar).
    const realizacionesDeActividad = await ctx.db
      .query("realizaciones")
      .withIndex("by_actividad", (q) => q.eq("actividadId", args.actividadId))
      .collect();
    const yaCompletadaPorAlgunEstudiante = realizacionesDeActividad.some(
      (r) => !r.cancelada && r.hFinReal !== undefined,
    );
    if (yaCompletadaPorAlgunEstudiante) {
      throw new Error(
        "No se puede modificar una actividad que algún estudiante ya ha completado",
      );
    }

    const cambiosActividad: {
      titulo?: string;
      descripcion?: string;
      duracion?: number;
      imagenId?: Id<"imagenes">;
    } = {};

    if (args.titulo !== undefined) {
      const titulo = args.titulo.trim();
      if (titulo.length === 0) {
        throw new Error("Falta el título de la actividad");
      }
      cambiosActividad.titulo = titulo;
    }
    if (args.descripcion !== undefined) {
      cambiosActividad.descripcion = args.descripcion;
    }
    if (args.duracion !== undefined) {
      if (!Number.isFinite(args.duracion) || args.duracion <= 0) {
        throw new Error("La duración común debe ser un número positivo");
      }
      cambiosActividad.duracion = args.duracion;
    }
    if (args.imagenId !== undefined) {
      cambiosActividad.imagenId = args.imagenId;
    }

    if (Object.keys(cambiosActividad).length > 0) {
      await ctx.db.patch("actividades", args.actividadId, cambiosActividad);
    }

    if (args.pasos !== undefined) {
      if (args.pasos.length === 0) {
        throw new Error("La actividad debe tener al menos un paso");
      }
      for (const [index, paso] of args.pasos.entries()) {
        if (paso.texto.trim().length === 0) {
          throw new Error(`Falta el texto del paso ${index + 1}`);
        }
        validarMedioDePaso(paso, index);
      }

      const pasosExistentes = await ctx.db
        .query("pasos")
        .withIndex("by_actividad_and_orden", (q) =>
          q.eq("actividadId", args.actividadId),
        )
        .collect();
      for (const paso of pasosExistentes) {
        await ctx.db.delete("pasos", paso._id);
      }
      for (const [index, paso] of args.pasos.entries()) {
        await ctx.db.insert("pasos", {
          actividadId: args.actividadId,
          orden: index,
          texto: paso.texto.trim(),
          tipoMedio: paso.tipoMedio,
          imagenId: paso.imagenId,
          archivoId: paso.archivoId,
        });
      }
    }

    return null;
  },
});

// GM-12 (desajuste #5): URL firmada de subida para que el cliente mande el
// archivo de vídeo/audio de un paso directamente a Convex File Storage.
// Solo tutores/administrador crean contenido de actividades.
export const generarUrlDeSubida = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireTutorOrAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// GM-12: URL de lectura para reproducir el vídeo/audio de un paso. No hace
// falta un rol concreto (tutor o estudiante pueden reproducir pasos), solo
// estar autenticado: los storageId no son adivinables ni se listan, y este
// proyecto no guarda en storage nada más sensible que pictogramas/medios de
// actividades.
export const obtenerUrlArchivo = query({
  args: { archivoId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("No autorizado: inicia sesión");
    }
    return await ctx.storage.getUrl(args.archivoId);
  },
});
