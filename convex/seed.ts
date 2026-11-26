import { v } from "convex/values";
import { env, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { actividadesDemo, estudiantesDemo, horarioDemo, pictogramas, sesionesDemo } from "./seedData";

// Datos de demostración (dev y previews). Nunca pública: solo se ejecuta por
// CLI (`npx convex run seed:seedDemoData`) o automáticamente en cada preview
// de Vercel vía `--preview-run seed:seedDemoData`. Cada preview nace con su
// propio deployment de Convex vacío, así que esta función crea desde cero
// una tutora, una clase y varios estudiantes con los que poder iniciar
// sesión para revisar el panel.
//
const ANIO_CURSO = "2026-2027";
const TUTOR = { email: "marta.ruiz@centro-demo.es", nombre: "Marta", apellidos: "Ruiz" };
const EMOCIONES = ["feliz", "triste", "enfadado", "sorprendido", "asustado", "tranquilo"];

export const seedDemoData = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const password = env.GUIAME_DEMO_PASSWORD;
    if (!password || password.length < 12) {
      throw new Error("Configura GUIAME_DEMO_PASSWORD en el deployment de demostración");
    }
    const { user: tutorUser } = await createAccount(ctx, {
      provider: "password",
      account: { id: TUTOR.email, secret: password },
      profile: {
        email: TUTOR.email,
        name: TUTOR.nombre,
        apellidos: TUTOR.apellidos,
        roles: ["tutor"],
        estadoCuenta: "activo",
      },
    });

    const estudianteIds: Id<"estudiantes">[] = [];
    for (const est of estudiantesDemo) {
      const { user: estUser } = await createAccount(ctx, {
        provider: "password",
        account: { id: est.usuario, secret: password },
        profile: {
          name: est.nombre,
          apellidos: est.apellidos,
          roles: ["estudiante"],
          estadoCuenta: "activo",
        },
      });
      const estudianteId: Id<"estudiantes"> = await ctx.runMutation(
        internal.seed.insertEstudiante,
        { userId: estUser._id },
      );
      estudianteIds.push(estudianteId);
    }

    await ctx.runMutation(internal.seed.insertClaseYRelaciones, {
      tutorUserId: tutorUser._id,
      estudianteIds,
    });

    return null;
  },
});

export const insertEstudiante = internalMutation({
  args: { userId: v.id("users") },
  returns: v.id("estudiantes"),
  handler: async (ctx, args) => {
    const existente = await ctx.db.query("estudiantes")
      .withIndex("by_userId", q => q.eq("userId", args.userId)).unique();
    if (existente) return existente._id;

    const estudianteId = await ctx.db.insert("estudiantes", { userId: args.userId });
    await ctx.db.insert("configuracionesVisuales", {
      estudianteId,
      paletaColor: "crema",
      escalaLetra: "normal",
      mostrarPictograma: true,
      mostrarTexto: true,
      mostrarVideo: false,
      mostrarAudio: false,
      rangoEmociones: "basico",
      permiteVerSemana: true,
      permiteCambiarColores: false,
      permiteDecirComoSeSiente: true,
      permiteCrearTareas: false,
    });
    return estudianteId;
  },
});

export const insertClaseYRelaciones = internalMutation({
  args: {
    tutorUserId: v.id("users"),
    estudianteIds: v.array(v.id("estudiantes")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tutor = await ctx.db.query("tutores")
      .withIndex("by_userId", q => q.eq("userId", args.tutorUserId)).unique();
    if (tutor) {
      const supervision = await ctx.db.query("supervisiones")
        .withIndex("by_tutor", q => q.eq("tutorId", tutor._id)).first();
      if (supervision) {
        const matriculas = await ctx.db.query("matriculas")
          .withIndex("by_clase_and_anio", q => q.eq("claseId", supervision.claseId)
            .eq("anioCursoAcademico", ANIO_CURSO)).take(estudiantesDemo.length + 1);
        if (matriculas.length === args.estudianteIds.length &&
            args.estudianteIds.every(id => matriculas.some(m => m.estudianteId === id))) {
          return null;
        }
        throw new Error("El deployment ya tiene un seed distinto. Usa un entorno de desarrollo nuevo");
      }
    }
    const tutorId = tutor?._id ?? await ctx.db.insert("tutores", {
      userId: args.tutorUserId,
      esFamiliar: false,
    });

    const claseId = await ctx.db.insert("clases", { nombre: "Aula 3" });

    await ctx.db.insert("supervisiones", {
      tutorId,
      claseId,
      anioCursoAcademico: ANIO_CURSO,
    });

    for (const estudianteId of args.estudianteIds) {
      await ctx.db.insert("matriculas", {
        estudianteId,
        claseId,
        anioCursoAcademico: ANIO_CURSO,
      });
    }

    for (let i = 0; i < EMOCIONES.length; i++) {
      const imagenId = await ctx.db.insert("imagenes", {
        ubicacionArchivo: "/demo-emocion.svg",
        textoAlternativo: EMOCIONES[i],
      });
      await ctx.db.insert("catalogoEmociones", {
        nombre: EMOCIONES[i],
        orden: i,
        imagenId,
      });
    }

    const imagenes = new Map<string, Id<"imagenes">>();
    for (const [clave, [arasaacId, textoAlternativo]] of Object.entries(pictogramas)) {
      imagenes.set(clave, await ctx.db.insert("imagenes", {
        arasaacId,
        textoAlternativo,
        ubicacionArchivo: `https://api.arasaac.org/v1/pictograms/${arasaacId}?download=false`,
      }));
    }

    function imagenDe(clave: keyof typeof pictogramas) {
      const id = imagenes.get(clave);
      if (!id) throw new Error("Falta un pictograma de demostración");
      return id;
    }

    const actividadIds = new Map<string, Id<"actividades">>();
    for (const [clave, actividad] of Object.entries(actividadesDemo)) {
      const actividadId = await ctx.db.insert("actividades", {
        titulo: actividad.titulo,
        tipoActividad: actividad.tipo,
        duracion: actividad.minutos,
        imagenId: imagenDe(actividad.imagen),
        creadoPor: args.tutorUserId,
        cancelada: false,
      });
      for (const [orden, [texto, imagen]] of actividad.pasos.entries()) {
        await ctx.db.insert("pasos", {
          actividadId, orden, texto, tipoMedio: "pictograma", imagenId: imagenDe(imagen),
        });
      }
      actividadIds.set(clave, actividadId);
    }

    for (const [dia, hora, indice, clave, estado] of sesionesDemo) {
      const actividadId = actividadIds.get(clave);
      const estudianteId = args.estudianteIds[indice];
      if (!actividadId || !estudianteId) throw new Error("Sesión de demostración inválida");
      const duracion = actividadesDemo[clave].minutos;
      const { inicio, fin } = horarioDemo(dia, hora, duracion);
      await ctx.db.insert("realizaciones", {
        estudianteId,
        actividadId,
        asignadoPor: tutorId,
        fInicioProgramada: inicio,
        fFinProgramada: fin,
        hInicioReal: estado ? inicio : undefined,
        hFinReal: estado === "hecha" ? fin : undefined,
        duracionEstudiante: estado === "hecha" ? duracion : undefined,
        cancelada: false,
      });
    }

    return null;
  },
});
