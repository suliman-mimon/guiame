import assert from "node:assert/strict";
import test from "node:test";
import { modificar } from "../convex/actividades.ts";
import { asignar, miAgenda, obtenerDetalle } from "../convex/realizaciones.ts";
import { catalogo, crear } from "../convex/tareasAlumno.ts";
import {
  fechaHoraTareaEnMadrid,
  rangoDiaMadrid,
} from "../src/components/estudiante/horario.ts";

const inicio = Date.parse("2026-11-27T08:00:00+01:00");
const minuto = 60000;
const args = {
  titulo: "  Leer un cuento  ",
  imagenId: "leer",
  fInicioProgramada: inicio,
};
const agendaDia = { inicio, fin: inicio + 120 * minuto };

function preparar(t) {
  t.mock.method(Date, "now", () => inicio - 60 * minuto);
  const datos = {
    users: [
      { _id: "alumna" },
      { _id: "otro" },
      { _id: "tutor" },
      { _id: "baja", estadoCuenta: "inactivo" },
    ],
    estudiantes: [
      { _id: "e1", userId: "alumna" },
      { _id: "e2", userId: "otro" },
      { _id: "e3", userId: "baja" },
    ],
    tutores: [{ _id: "t1", userId: "tutor" }],
    vinculosDirectos: [{ tutorId: "t1", estudianteId: "e1" }],
    configuracionesVisuales: [
      { estudianteId: "e1", permiteCrearTareas: true },
      { estudianteId: "e3", permiteCrearTareas: true },
    ],
    imagenes: [
      { _id: "leer", arasaacId: "7141", textoAlternativo: "Leer" },
      { _id: "provisional" },
    ],
    actividades: [
      {
        _id: "a-tutor",
        titulo: "Asignada",
        creadoPor: "tutor",
        imagenId: "leer",
        tipoActividad: "academica",
      },
    ],
    realizaciones: [],
    pasos: [],
  };
  const db = {
    get: async (tabla, id) =>
      datos[tabla].find((doc) => doc._id === id) ?? null,
    insert: async (tabla, campos) => {
      const _id = `${tabla}-${datos[tabla].length}`;
      datos[tabla].push({ _id, ...campos });
      return _id;
    },
    query: (tabla) => ({
      take: async (n) => datos[tabla].slice(0, n),
      withIndex: (_indice, seleccionar) => {
        let filas = datos[tabla];
        const condiciones = {
          eq: (campo, valor) => {
            filas = filas.filter((doc) => doc[campo] === valor);
            return condiciones;
          },
          gte: (campo, valor) => {
            filas = filas.filter((doc) => doc[campo] >= valor);
            return condiciones;
          },
          lt: (campo, valor) => {
            filas = filas.filter((doc) => doc[campo] < valor);
            return condiciones;
          },
        };
        seleccionar(condiciones);
        return {
          unique: async () => filas[0] ?? null,
          collect: async () => filas,
        };
      },
    }),
  };
  const contexto = (usuario) => ({
    db,
    auth: {
      getUserIdentity: async () =>
        usuario ? { subject: `${usuario}|sesion` } : null,
    },
  });
  return { datos, contexto };
}

function sinEscrituras(datos) {
  assert.equal(datos.actividades.length, 1);
  assert.equal(datos.pasos.length, 0);
  assert.equal(datos.realizaciones.length, 0);
}

test("con permiso crea actividad, paso y realización propia y aparece en miAgenda", async (t) => {
  const { contexto, datos } = preparar(t);
  const ctx = contexto("alumna");
  const id = await crear._handler(ctx, args);
  const tarea = datos.realizaciones[0];
  const actividad = datos.actividades.at(-1);
  assert.equal(tarea._id, id);
  assert.equal(tarea.estudianteId, "e1");
  assert.equal(tarea.origen, "propia");
  assert.equal("asignadoPor" in tarea, false);
  assert.equal(tarea.fFinProgramada - tarea.fInicioProgramada, 30 * minuto);
  assert.equal(tarea.actividadId, actividad._id);
  assert.equal(actividad.creadoPor, "alumna");
  assert.equal(actividad.titulo, "Leer un cuento");
  assert.equal(actividad.tipoActividad, "del_estudiante");
  const [entrada] = await miAgenda._handler(ctx, agendaDia);
  assert.equal(entrada.realizacionId, id);
  assert.equal(entrada.imagenId, "leer");
  const detalle = await obtenerDetalle._handler(ctx, { realizacionId: id });
  assert.deepEqual(
    detalle.pasos.map((p) => [p.texto, p.imagenId, p.orden]),
    [["Leer un cuento", "leer", 0]],
  );
  assert.deepEqual(await miAgenda._handler(contexto("otro"), agendaDia), []);
});

test("sin sesión, rol de tutor, permiso ausente, permiso desactivado y cuenta inactiva se rechazan", async (t) => {
  const { contexto, datos } = preparar(t);
  for (const usuario of [null, "tutor", "otro", "baja"]) {
    await assert.rejects(
      crear._handler(contexto(usuario), args),
      /No autorizado|permiso/,
    );
  }
  datos.configuracionesVisuales[0].permiteCrearTareas = false;
  await assert.rejects(crear._handler(contexto("alumna"), args), /permiso/);
  assert.deepEqual(await catalogo._handler(contexto("alumna"), {}), []);
  sinEscrituras(datos);
});

test("la mutación pública no admite un destinatario y el handler deriva su identidad", async (t) => {
  const { contexto, datos } = preparar(t);
  const validator = JSON.parse(crear.exportArgs());
  assert.equal(Object.hasOwn(validator.value, "estudianteId"), false);
  await crear._handler(contexto("alumna"), { ...args, estudianteId: "e2" });
  assert.equal(datos.realizaciones[0].estudianteId, "e1");
  await assert.rejects(
    modificar._handler(contexto("otro"), {
      actividadId: datos.actividades.at(-1)._id,
    }),
    /No autorizado/,
  );
});

test("valida título, fecha y pictograma antes de insertar registros", async (t) => {
  const { contexto, datos } = preparar(t);
  const ctx = contexto("alumna");
  await assert.rejects(
    crear._handler(ctx, { ...args, titulo: "   " }),
    /título/,
  );
  await assert.rejects(
    crear._handler(ctx, { ...args, titulo: "x".repeat(121) }),
    /título/,
  );
  for (const valor of [Infinity, NaN, inicio + 1, inicio - 120 * minuto]) {
    await assert.rejects(
      crear._handler(ctx, { ...args, fInicioProgramada: valor }),
      /fecha/,
    );
  }
  for (const imagenId of ["inexistente", "provisional"]) {
    await assert.rejects(
      crear._handler(ctx, { ...args, imagenId }),
      /pictograma/,
    );
  }
  assert.deepEqual(await catalogo._handler(ctx, {}), [
    { id: "leer", nombre: "Leer", arasaacId: "7141" },
  ]);
  sinEscrituras(datos);
});

test("el horario bloquea solapamientos en ambos sentidos y conserva asignaciones profesionales", async (t) => {
  const { contexto, datos } = preparar(t);
  const ctxTutor = contexto("tutor");
  const ctxAlumno = contexto("alumna");
  const asignacion = (fInicioProgramada) => ({
    actividadId: "a-tutor",
    asignaciones: [
      {
        estudianteId: "e1",
        fInicioProgramada,
        fFinProgramada: fInicioProgramada + 30 * minuto,
      },
    ],
  });
  await asignar._handler(ctxTutor, asignacion(inicio));
  await assert.rejects(
    crear._handler(ctxAlumno, { ...args, fInicioProgramada: inicio + minuto }),
    /Ya tienes/,
  );
  assert.equal(datos.actividades.length, 1);
  assert.equal(datos.pasos.length, 0);
  await crear._handler(ctxAlumno, {
    ...args,
    fInicioProgramada: inicio + 30 * minuto,
  });
  await assert.rejects(
    asignar._handler(ctxTutor, asignacion(inicio + 45 * minuto)),
    /solapa/,
  );
  assert.equal(datos.realizaciones.length, 2);
  assert.equal(datos.realizaciones[0].asignadoPor, "t1");
  assert.deepEqual(
    (await miAgenda._handler(ctxAlumno, agendaDia)).map((a) => a.tipoActividad),
    ["academica", "del_estudiante"],
  );
});

test("las horas se interpretan en Madrid y se rechazan fechas inexistentes o ambiguas", () => {
  assert.equal(fechaHoraTareaEnMadrid("2026-11-27", "08:00"), inicio);
  assert.equal(fechaHoraTareaEnMadrid("2026-02-30", "08:00"), null);
  assert.equal(fechaHoraTareaEnMadrid("2026-03-29", "02:30"), null);
  assert.equal(fechaHoraTareaEnMadrid("2026-10-25", "02:30"), null);
  for (const [dia, horas] of [
    ["2026-03-29", 23],
    ["2026-10-25", 25],
  ]) {
    const { inicio, fin } = rangoDiaMadrid(dia);
    assert.equal(fin - inicio, horas * 60 * minuto);
  }
});

test("una sesión cancelada no ocupa el horario ni reaparece en la agenda", async (t) => {
  const { contexto, datos } = preparar(t);
  datos.realizaciones.push({
    _id: "cancelada",
    estudianteId: "e1",
    actividadId: "a-tutor",
    asignadoPor: "t1",
    fInicioProgramada: inicio,
    fFinProgramada: inicio + 30 * minuto,
    cancelada: true,
  });
  const alumno = contexto("alumna");
  const propia = await crear._handler(alumno, args);
  assert.deepEqual(
    (await miAgenda._handler(alumno, agendaDia)).map((r) => r.realizacionId),
    [propia],
  );
  assert.equal(datos.realizaciones[0].asignadoPor, "t1");
  assert.equal(datos.realizaciones[0].cancelada, true);
  datos.configuracionesVisuales[0].permiteCrearTareas = false;
  const otraHora = inicio + 60 * minuto;
  await assert.rejects(
    crear._handler(alumno, { ...args, fInicioProgramada: otraHora }),
    /permiso/,
  );
  assert.equal(datos.realizaciones.length, 2);
  assert.equal(datos.pasos.length, 1);
  assert.equal(datos.actividades.length, 2);
});
