import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { asegurarCatalogo } from "./imagenes";

// Preparar el día de la demo al CEE (GM-14 / GM-13). El seed (GM-05) crea las
// cuentas y la clase, pero solo una actividad por estudiante y con imágenes
// provisionales. Esto deja la agenda de hoy como la de un día real de cole:
// varias actividades por estudiante, unas hechas, una en curso, un retraso
// (RF5.1) y huecos libres para crear una actividad en directo.
//
// Las horas van relativas al momento en que se ejecuta, así que hay que
// lanzarlo justo antes de la demo (y antes del ensayo):
//   npx convex run demo:prepararDia            (desarrollo)
//   npx convex run demo:prepararDia --prod     (producción, tras el seed)
// Se puede repetir: cancela lo que había entre 12 h antes y 12 h después y
// vuelve a crear el día.

const MINUTO = 60 * 1000;

type Tipo = "academica" | "profesional" | "familiar";

const ACTIVIDADES: Record<
  string,
  { tipo: Tipo; arasaacId: string; pasos: Array<[texto: string, arasaacId: string]> }
> = {
  "Entrar a clase": {
    tipo: "academica",
    arasaacId: "9815",
    pasos: [
      ["Colgar la mochila", "2475"],
      ["Sentarse en su sitio", "9815"],
    ],
  },
  Asamblea: {
    tipo: "academica",
    arasaacId: "27574",
    pasos: [
      ["Sentarse en el corro", "27574"],
      ["Contar qué hicimos ayer", "9870"],
    ],
  },
  "Taller de cocina": {
    tipo: "academica",
    arasaacId: "2342",
    pasos: [
      ["Lavarse las manos", "8977"],
      ["Preparar los ingredientes", "2342"],
      ["Cocinar con ayuda", "2342"],
    ],
  },
  Logopedia: {
    tipo: "profesional",
    arasaacId: "32428",
    pasos: [
      ["Ir a la sala de logopedia", "32428"],
      ["Hacer los ejercicios", "9870"],
    ],
  },
  Música: {
    tipo: "academica",
    arasaacId: "24791",
    pasos: [["Coger el instrumento", "24791"]],
  },
  Comedor: {
    tipo: "academica",
    arasaacId: "5970",
    pasos: [
      ["Lavarse las manos", "8977"],
      ["Comer", "6456"],
    ],
  },
  "Ir al autobús": {
    tipo: "familiar",
    arasaacId: "2262",
    pasos: [
      ["Coger la mochila", "2475"],
      ["Hacer la fila", "7102"],
      ["Subir al autobús", "2262"],
    ],
  },
};

type Estado = "hecha" | "en_curso" | "pendiente";

// Agenda de cada estudiante, en el orden en que los matricula el seed: minutos
// respecto a ahora y estado. La primera (Lucía) es la protagonista de la demo:
// tiene libre de +40 a +120 minutos para crearle una actividad en directo. La
// segunda lleva 15 minutos de retraso en Logopedia.
const PLAN: Array<Array<[titulo: string, desde: number, hasta: number, estado: Estado]>> = [
  [
    ["Entrar a clase", -150, -120, "hecha"],
    ["Asamblea", -110, -80, "hecha"],
    ["Taller de cocina", -20, 40, "en_curso"],
    ["Comedor", 120, 180, "pendiente"],
    ["Ir al autobús", 300, 330, "pendiente"],
  ],
  [
    ["Entrar a clase", -150, -120, "hecha"],
    ["Logopedia", -15, 30, "pendiente"],
    ["Comedor", 120, 180, "pendiente"],
  ],
  [
    ["Entrar a clase", -150, -120, "hecha"],
    ["Asamblea", -110, -80, "hecha"],
    ["Música", -10, 35, "en_curso"],
    ["Comedor", 120, 180, "pendiente"],
  ],
  [
    ["Entrar a clase", -150, -120, "hecha"],
    ["Asamblea", -110, -80, "hecha"],
    ["Taller de cocina", 60, 115, "pendiente"],
    ["Comedor", 130, 190, "pendiente"],
  ],
];

export const prepararDia = internalMutation({
  args: {},
  returns: v.object({ estudiantes: v.number(), actividades: v.number() }),
  handler: async (ctx) => {
    await asegurarCatalogo(ctx);

    const imagenPorArasaac = new Map<string, Id<"imagenes">>();
    for (const imagen of await ctx.db.query("imagenes").take(2000)) {
      if (imagen.arasaacId !== undefined && !imagenPorArasaac.has(imagen.arasaacId)) {
        imagenPorArasaac.set(imagen.arasaacId, imagen._id);
      }
    }
    const imagen = (arasaacId: string) => {
      const id = imagenPorArasaac.get(arasaacId);
      if (id === undefined) throw new Error(`Falta el pictograma ${arasaacId} en el catálogo`);
      return id;
    };

    // La tutora del seed y los estudiantes de su clase, en orden de matrícula.
    const supervision = await ctx.db.query("supervisiones").first();
    if (supervision === null) {
      throw new Error("No hay ninguna clase supervisada: ejecuta antes seed:seedDemoData");
    }
    const tutor = await ctx.db.get("tutores", supervision.tutorId);
    if (tutor === null) throw new Error("La supervisión apunta a un tutor que no existe");
    const matriculas = await ctx.db
      .query("matriculas")
      .withIndex("by_clase_and_anio", (q) =>
        q.eq("claseId", supervision.claseId).eq("anioCursoAcademico", supervision.anioCursoAcademico),
      )
      .collect();
    const estudianteIds = matriculas.map((m) => m.estudianteId);

    // Las actividades de la demo, creadas por la tutora (se reutilizan si ya
    // existen de una ejecución anterior).
    const existentes = await ctx.db
      .query("actividades")
      .withIndex("by_creadoPor", (q) => q.eq("creadoPor", tutor.userId))
      .collect();
    const actividadPorTitulo = new Map<string, Id<"actividades">>();
    for (const actividad of existentes) {
      if (!actividad.cancelada) actividadPorTitulo.set(actividad.titulo, actividad._id);
    }
    for (const [titulo, datos] of Object.entries(ACTIVIDADES)) {
      if (actividadPorTitulo.has(titulo)) continue;
      const actividadId = await ctx.db.insert("actividades", {
        titulo,
        tipoActividad: datos.tipo,
        imagenId: imagen(datos.arasaacId),
        creadoPor: tutor.userId,
        cancelada: false,
      });
      for (const [orden, [texto, arasaacId]] of datos.pasos.entries()) {
        await ctx.db.insert("pasos", {
          actividadId,
          orden,
          texto,
          tipoMedio: "pictograma",
          imagenId: imagen(arasaacId),
        });
      }
      actividadPorTitulo.set(titulo, actividadId);
    }

    // Día limpio: se cancela lo que hubiera en las 24 h alrededor de ahora.
    const ahora = Math.floor(Date.now() / (5 * MINUTO)) * 5 * MINUTO;
    for (const estudianteId of estudianteIds) {
      const previas = await ctx.db
        .query("realizaciones")
        .withIndex("by_estudiante_and_inicio", (q) =>
          q
            .eq("estudianteId", estudianteId)
            .gte("fInicioProgramada", ahora - 12 * 60 * MINUTO)
            .lt("fInicioProgramada", ahora + 12 * 60 * MINUTO),
        )
        .collect();
      for (const previa of previas) {
        if (!previa.cancelada) await ctx.db.patch("realizaciones", previa._id, { cancelada: true });
      }
    }

    let creadas = 0;
    for (const [i, estudianteId] of estudianteIds.entries()) {
      for (const [titulo, desde, hasta, estado] of PLAN[i % PLAN.length]) {
        const inicio = ahora + desde * MINUTO;
        const fin = ahora + hasta * MINUTO;
        await ctx.db.insert("realizaciones", {
          estudianteId,
          actividadId: actividadPorTitulo.get(titulo)!,
          asignadoPor: tutor._id,
          fInicioProgramada: inicio,
          fFinProgramada: fin,
          hInicioReal: estado === "pendiente" ? undefined : inicio + 2 * MINUTO,
          hFinReal: estado === "hecha" ? fin - 3 * MINUTO : undefined,
          cancelada: false,
        });
        creadas += 1;
      }
    }

    return { estudiantes: estudianteIds.length, actividades: creadas };
  },
});

// Para las previews de Vercel (`--preview-run demo:sembrarTodo`): cuentas,
// clase y día de demo en un solo paso.
export const sembrarTodo = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runAction(internal.seed.seedDemoData, {});
    await ctx.runMutation(internal.demo.prepararDia, {});
    return null;
  },
});
