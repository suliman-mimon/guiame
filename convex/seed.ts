import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Datos de demostración (dev y previews). Nunca pública: solo se ejecuta por
// CLI (`npx convex run seed:seedDemoData`) o automáticamente en cada preview
// de Vercel vía `--preview-run seed:seedDemoData`. Cada preview nace con su
// propio deployment de Convex vacío, así que esta función crea desde cero
// una tutora, una clase y varios estudiantes con los que poder iniciar
// sesión para revisar el panel.
//
// Las 4 actividades con pictograma de abajo son contenido de ejemplo
// provisional (HT5); cuando llegue el contenido real de Ignacio se
// sustituyen sin tocar la estructura del seed.

const ANIO_CURSO = "2026-2027";

const TUTOR = {
  email: "marta.ruiz@centro-demo.es",
  password: "Demo1234!",
  nombre: "Marta",
  apellidos: "Ruiz",
};

const ESTUDIANTES = [
  { usuario: "lucia", password: "Demo1234!", nombre: "Lucía", apellidos: "Martín" },
  { usuario: "pablo", password: "Demo1234!", nombre: "Pablo", apellidos: "García" },
  { usuario: "ana", password: "Demo1234!", nombre: "Ana", apellidos: "Fernández" },
  { usuario: "javier", password: "Demo1234!", nombre: "Javier", apellidos: "López" },
];

// Catálogo fijo de 6 emociones (desajuste #6 del esquema). La imagen es un
// placeholder hasta que se cargue el pictograma ARASAAC real de cada una.
const EMOCIONES = [
  "feliz",
  "triste",
  "enfadado",
  "sorprendido",
  "asustado",
  "tranquilo",
];

// 4 actividades con pictograma (B4), una por estudiante de ejemplo. Los
// pictogramas son placeholders hasta tener los ARASAAC reales.
const ACTIVIDADES = [
  {
    titulo: "Desayunar",
    descripcion: "Desayuno en el comedor antes de empezar las clases.",
    tipoActividad: "familiar" as const,
    duracion: 20,
    pictograma: "desayuno",
    pasos: [
      { texto: "Lavarse las manos", pictograma: "lavarse_manos" },
      { texto: "Comer el desayuno", pictograma: "comer" },
    ],
  },
  {
    titulo: "Lavarse los dientes",
    descripcion: "Higiene dental después del desayuno.",
    tipoActividad: "familiar" as const,
    duracion: 5,
    pictograma: "cepillo_dientes",
    pasos: [{ texto: "Cepillarse los dientes", pictograma: "cepillo_dientes" }],
  },
  {
    titulo: "Tarea de matemáticas",
    descripcion: "Ejercicios de sumas con apoyo visual.",
    tipoActividad: "academica" as const,
    duracion: 30,
    pictograma: "matematicas",
    pasos: [
      { texto: "Coger el cuaderno y el lápiz", pictograma: "cuaderno" },
      { texto: "Hacer los ejercicios", pictograma: "matematicas" },
    ],
  },
  {
    titulo: "Salir al recreo",
    descripcion: "Tiempo libre en el patio.",
    tipoActividad: "academica" as const,
    duracion: 15,
    pictograma: "recreo",
    pasos: [{ texto: "Salir al patio", pictograma: "recreo" }],
  },
];

export const seedDemoData = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { user: tutorUser } = await createAccount(ctx, {
      provider: "password",
      account: { id: TUTOR.email, secret: TUTOR.password },
      profile: {
        email: TUTOR.email,
        name: TUTOR.nombre,
        apellidos: TUTOR.apellidos,
        roles: ["tutor"],
        estadoCuenta: "activo",
      },
    });

    const estudianteIds: Id<"estudiantes">[] = [];
    for (const est of ESTUDIANTES) {
      const { user: estUser } = await createAccount(ctx, {
        provider: "password",
        account: { id: est.usuario, secret: est.password },
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
    const estudianteId = await ctx.db.insert("estudiantes", {
      userId: args.userId,
    });
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
    const tutorId = await ctx.db.insert("tutores", {
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
        ubicacionArchivo: `/placeholder/emociones/${EMOCIONES[i]}.svg`,
        textoAlternativo: EMOCIONES[i],
      });
      await ctx.db.insert("catalogoEmociones", {
        nombre: EMOCIONES[i],
        orden: i,
        imagenId,
      });
    }

    const actividadIds: Id<"actividades">[] = [];
    for (const actividad of ACTIVIDADES) {
      const imagenId = await ctx.db.insert("imagenes", {
        ubicacionArchivo: `/placeholder/actividades/${actividad.pictograma}.svg`,
        textoAlternativo: actividad.pictograma,
      });
      const actividadId = await ctx.db.insert("actividades", {
        titulo: actividad.titulo,
        descripcion: actividad.descripcion,
        tipoActividad: actividad.tipoActividad,
        duracion: actividad.duracion,
        imagenId,
        creadoPor: args.tutorUserId,
        cancelada: false,
      });
      for (let i = 0; i < actividad.pasos.length; i++) {
        const pasoImagenId = await ctx.db.insert("imagenes", {
          ubicacionArchivo: `/placeholder/actividades/${actividad.pasos[i].pictograma}.svg`,
          textoAlternativo: actividad.pasos[i].pictograma,
        });
        await ctx.db.insert("pasos", {
          actividadId,
          orden: i,
          texto: actividad.pasos[i].texto,
          tipoMedio: "pictograma",
          imagenId: pasoImagenId,
        });
      }
      actividadIds.push(actividadId);
    }

    // Una realización por estudiante hoy, con una mezcla de estados: la
    // primera ya completada, la segunda en curso, el resto pendientes.
    const MINUTO = 60 * 1000;
    const ahora = Date.now();
    const n = Math.min(args.estudianteIds.length, actividadIds.length);
    for (let i = 0; i < n; i++) {
      const duracion = ACTIVIDADES[i].duracion;
      const inicioProgramado = ahora + (i - 1) * 90 * MINUTO;
      const finProgramado = inicioProgramado + duracion * MINUTO;
      const completada = i === 0;
      const enCurso = i === 1;
      await ctx.db.insert("realizaciones", {
        estudianteId: args.estudianteIds[i],
        actividadId: actividadIds[i],
        asignadoPor: tutorId,
        fInicioProgramada: inicioProgramado,
        fFinProgramada: finProgramado,
        hInicioReal: completada || enCurso ? inicioProgramado : undefined,
        hFinReal: completada ? finProgramado : undefined,
        duracionEstudiante: completada ? duracion : undefined,
        cancelada: false,
      });
    }

    return null;
  },
});
