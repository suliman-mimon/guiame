import { v } from "convex/values";
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  getCurrentUser,
  requireSelfEstudiante,
  requireVeAlEstudianteOrAdmin,
} from "./lib/auth";

// RI3.1. Configuración visual y permisos del alumno (GM-10).
//
// RF4.1 (cambiar colores), RF4.2 (tamaño de letra) y RF4.3 (apoyo visual:
// pictograma/texto/vídeo/audio, cada uno activable por separado, con la
// regla de que siempre debe quedar visible el texto o los pictogramas).
// Los 4 "permite*" y rangoEmociones son los permisos del alumno y el rango
// de emociones añadidos tras la Propuesta (ver comentario de la tabla en
// schema.ts); esta ficha solo los guarda y los expone, sin aplicarlos
// todavía en las pantallas que algún día los consultarán
// (realizaciones.listarAgenda para permiteVerSemana, actividades.crear
// para permiteCrearTareas) — eso queda, a propósito, para quien construya
// esas pantallas.

const paletaColorValidator = v.union(
  v.literal("crema"),
  v.literal("alto_contraste"),
  v.literal("azul_calma"),
  v.literal("noche"),
);

const escalaLetraValidator = v.union(
  v.literal("normal"),
  v.literal("grande"),
  v.literal("muy_grande"),
);

const rangoEmocionesValidator = v.union(
  v.literal("basico"),
  v.literal("ampliado"),
);

// Campos de la tabla sin los campos de sistema (_id, _creationTime).
const configuracionVisualFields = {
  estudianteId: v.id("estudiantes"),
  paletaColor: paletaColorValidator,
  escalaLetra: escalaLetraValidator,
  mostrarPictograma: v.boolean(),
  mostrarTexto: v.boolean(),
  mostrarVideo: v.boolean(),
  mostrarAudio: v.boolean(),
  rangoEmociones: rangoEmocionesValidator,
  permiteVerSemana: v.boolean(),
  permiteCambiarColores: v.boolean(),
  permiteDecirComoSeSiente: v.boolean(),
  permiteCrearTareas: v.boolean(),
};

const configuracionVisualValidator = v.object(configuracionVisualFields);

function aCampos(doc: Doc<"configuracionesVisuales">) {
  return {
    estudianteId: doc.estudianteId,
    paletaColor: doc.paletaColor,
    escalaLetra: doc.escalaLetra,
    mostrarPictograma: doc.mostrarPictograma,
    mostrarTexto: doc.mostrarTexto,
    mostrarVideo: doc.mostrarVideo,
    mostrarAudio: doc.mostrarAudio,
    rangoEmociones: doc.rangoEmociones,
    permiteVerSemana: doc.permiteVerSemana,
    permiteCambiarColores: doc.permiteCambiarColores,
    permiteDecirComoSeSiente: doc.permiteDecirComoSeSiente,
    permiteCrearTareas: doc.permiteCrearTareas,
  };
}

// Ver la configuración de un alumno la puede pedir el propio alumno o un
// tutor/administrador autorizado a verlo (mismo criterio que
// requireVeAlEstudianteOrAdmin). No se duplica como helper exportado en
// lib/auth.ts porque, de momento, solo lo necesita esta ficha.
async function requireVerConfiguracion(
  ctx: QueryCtx | MutationCtx,
  estudianteId: Id<"estudiantes">,
): Promise<void> {
  const current = await getCurrentUser(ctx);
  if (current !== null && current.kind === "estudiante") {
    if (current.estudiante._id !== estudianteId) {
      throw new Error(
        "No autorizado: solo puedes ver tu propia configuración",
      );
    }
    return;
  }

  await requireVeAlEstudianteOrAdmin(ctx, estudianteId);
}

export function cargarConfiguracion(
  ctx: QueryCtx | MutationCtx,
  estudianteId: Id<"estudiantes">,
) {
  return ctx.db.query("configuracionesVisuales")
    .withIndex("by_estudiante", q => q.eq("estudianteId", estudianteId))
    .unique();
}

export const obtener = query({
  args: { estudianteId: v.id("estudiantes") },
  returns: v.union(v.null(), configuracionVisualValidator),
  handler: async (ctx, args) => {
    await requireVerConfiguracion(ctx, args.estudianteId);

    const doc = await cargarConfiguracion(ctx, args.estudianteId);

    if (doc === null) return null;
    return aCampos(doc);
  },
});

// Igual que obtener, pero para que el propio estudiante consulte su
// configuración sin tener que conocer (ni poder falsear) su estudianteId:
// se deriva de la sesión con requireSelfEstudiante. Pedida por Pablo en el
// #13: sin esto, el lado del alumno no tiene cómo pedir su configuración.
export const miConfiguracion = query({
  args: {},
  returns: v.union(v.null(), configuracionVisualValidator),
  handler: async (ctx) => {
    const estudiante = await requireSelfEstudiante(ctx);

    const doc = await cargarConfiguracion(ctx, estudiante._id);

    if (doc === null) return null;
    return aCampos(doc);
  },
});

export const actualizar = mutation({
  args: {
    estudianteId: v.id("estudiantes"),
    paletaColor: v.optional(paletaColorValidator),
    escalaLetra: v.optional(escalaLetraValidator),
    mostrarPictograma: v.optional(v.boolean()),
    mostrarTexto: v.optional(v.boolean()),
    mostrarVideo: v.optional(v.boolean()),
    mostrarAudio: v.optional(v.boolean()),
    rangoEmociones: v.optional(rangoEmocionesValidator),
    permiteVerSemana: v.optional(v.boolean()),
    permiteCambiarColores: v.optional(v.boolean()),
    permiteDecirComoSeSiente: v.optional(v.boolean()),
    permiteCrearTareas: v.optional(v.boolean()),
  },
  returns: configuracionVisualValidator,
  handler: async (ctx, args) => {
    // Solo tutor/administrador autorizado a ver a este alumno puede
    // cambiar su configuración visual y sus permisos.
    await requireVeAlEstudianteOrAdmin(ctx, args.estudianteId);

    const { estudianteId, ...cambios } = args;

    const existente = await cargarConfiguracion(ctx, estudianteId);

    if (existente === null) {
      // No hay fila todavía para este alumno: se crea, pero exigiendo el
      // objeto completo. No inventamos valores por defecto para campos de
      // negocio (p.ej. paletaColor) porque esa es una decisión de
      // producto, no nuestra. En la práctica, convex/seed.ts ya crea esta
      // fila completa para cada alumno de ejemplo al darlo de alta, así
      // que este camino solo se ejerce si algún día se crea un alumno
      // real sin pasar por el seed.
      const camposFaltantes = (
        [
          ["paletaColor", cambios.paletaColor],
          ["escalaLetra", cambios.escalaLetra],
          ["mostrarPictograma", cambios.mostrarPictograma],
          ["mostrarTexto", cambios.mostrarTexto],
          ["mostrarVideo", cambios.mostrarVideo],
          ["mostrarAudio", cambios.mostrarAudio],
          ["rangoEmociones", cambios.rangoEmociones],
          ["permiteVerSemana", cambios.permiteVerSemana],
          ["permiteCambiarColores", cambios.permiteCambiarColores],
          ["permiteDecirComoSeSiente", cambios.permiteDecirComoSeSiente],
          ["permiteCrearTareas", cambios.permiteCrearTareas],
        ] as const
      )
        .filter(([, valor]) => valor === undefined)
        .map(([nombre]) => nombre);

      if (camposFaltantes.length > 0) {
        throw new Error(
          `Este alumno todavía no tiene configuración visual: para crearla hay que enviar todos los campos. Faltan: ${camposFaltantes.join(", ")}`,
        );
      }

      const mostrarTexto = cambios.mostrarTexto!;
      const mostrarPictograma = cambios.mostrarPictograma!;
      if (!mostrarTexto && !mostrarPictograma) {
        throw new Error(
          "No se puede guardar: siempre debe quedar visible el texto o los pictogramas (RF4.3)",
        );
      }

      const id = await ctx.db.insert("configuracionesVisuales", {
        estudianteId,
        paletaColor: cambios.paletaColor!,
        escalaLetra: cambios.escalaLetra!,
        mostrarPictograma,
        mostrarTexto,
        mostrarVideo: cambios.mostrarVideo!,
        mostrarAudio: cambios.mostrarAudio!,
        rangoEmociones: cambios.rangoEmociones!,
        permiteVerSemana: cambios.permiteVerSemana!,
        permiteCambiarColores: cambios.permiteCambiarColores!,
        permiteDecirComoSeSiente: cambios.permiteDecirComoSeSiente!,
        permiteCrearTareas: cambios.permiteCrearTareas!,
      });
      const creado = await ctx.db.get("configuracionesVisuales", id);
      return aCampos(creado!);
    }

    // Actualización parcial sobre una fila ya existente: solo se tocan
    // los campos enviados.
    const mostrarTextoResultante = cambios.mostrarTexto ?? existente.mostrarTexto;
    const mostrarPictogramaResultante =
      cambios.mostrarPictograma ?? existente.mostrarPictograma;
    if (!mostrarTextoResultante && !mostrarPictogramaResultante) {
      throw new Error(
        "No se puede guardar: siempre debe quedar visible el texto o los pictogramas (RF4.3)",
      );
    }

    await ctx.db.patch("configuracionesVisuales", existente._id, cambios);
    const actualizado = await ctx.db.get("configuracionesVisuales", existente._id);
    return aCampos(actualizado!);
  },
});
