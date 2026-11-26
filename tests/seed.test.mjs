import assert from "node:assert/strict";
import test from "node:test";
import { insertClaseYRelaciones, insertEstudiante } from "../convex/seed.ts";
import { estudiantesDemo } from "../convex/seedData.ts";

function baseEnMemoria() {
  const tablas = new Map();
  const tabla = (nombre) => {
    if (!tablas.has(nombre)) tablas.set(nombre, []);
    return tablas.get(nombre);
  };
  const db = {
    insert: async (nombre, doc) => {
      const filas = tabla(nombre);
      const _id = nombre + "-" + filas.length;
      filas.push({ _id, ...doc });
      return _id;
    },
    query: (nombre) => ({
      withIndex: (_indice, seleccionar) => {
        let filas = tabla(nombre);
        const rango = {
          eq: (campo, valor) => { filas = filas.filter(fila => fila[campo] === valor); return rango; },
        };
        seleccionar(rango);
        return {
          first: async () => filas[0] ?? null,
          unique: async () => filas[0] ?? null,
          take: async n => filas.slice(0, n),
        };
      },
    }),
  };
  return { tabla, ctx: { db } };
}

test("seed: seis perfiles, Aula 3, supervisión, pasos y 25 sesiones sin solapamientos", async () => {
  const { tabla, ctx } = baseEnMemoria();
  assert.deepEqual(estudiantesDemo.map(({ nombre, apellidos }) => [nombre, apellidos]),
    [["Lucía", "M"], ["Daniel", "R"], ["Aitana", "G"], ["Hugo", "P"], ["Sara", "L"], ["Mateo", "C"]]);

  const tutorUserId = "marta";
  const estudianteIds = [];
  for (const { usuario } of estudiantesDemo) {
    estudianteIds.push(await insertEstudiante._handler(ctx, { userId: usuario }));
  }
  await insertClaseYRelaciones._handler(ctx, { tutorUserId, estudianteIds });
  assert.equal(tabla("tutores")[0].userId, tutorUserId);
  assert.equal(tabla("clases")[0].nombre, "Aula 3");
  assert.equal(tabla("supervisiones")[0].tutorId, tabla("tutores")[0]._id);
  assert.equal(tabla("supervisiones")[0].claseId, tabla("clases")[0]._id);
  assert.equal(tabla("supervisiones")[0].anioCursoAcademico, "2026-2027");
  assert.equal(tabla("matriculas").length, 6);
  assert.equal(tabla("configuracionesVisuales").length, 6);
  assert.equal(tabla("catalogoEmociones").length, 6);
  assert.equal(tabla("realizaciones").length, 25);

  const fechas = new Set();
  for (const estudianteId of estudianteIds) {
    const agenda = tabla("realizaciones").filter(r => r.estudianteId === estudianteId);
    assert.ok(agenda.length > 0);
    agenda.sort((a, b) => a.fInicioProgramada - b.fInicioProgramada);
    for (const [i, r] of agenda.entries()) {
      assert.ok(r.fFinProgramada > r.fInicioProgramada);
      if (i > 0) assert.ok(agenda[i - 1].fFinProgramada <= r.fInicioProgramada);
      const fecha = new Date(r.fInicioProgramada + 3600000).toISOString().slice(0, 10);
      fechas.add(fecha);
      const actividad = tabla("actividades").find(a => a._id === r.actividadId);
      assert.ok(tabla("pasos").some(p => p.actividadId === actividad._id));
      assert.ok(tabla("imagenes").some(p => p._id === actividad.imagenId && p.arasaacId));
      if (fecha >= "2026-11-26" && estudianteIds.slice(0, 2).includes(estudianteId)) {
        const inicioTaller = Date.parse(fecha + "T11:30:00+01:00");
        const finTaller = Date.parse(fecha + "T12:30:00+01:00");
        assert.ok(r.fFinProgramada <= inicioTaller || r.fInicioProgramada >= finTaller);
      }
    }
  }
  assert.deepEqual([...fechas].sort(), ["23", "24", "25", "26", "27"].map(dia => "2026-11-" + dia));
  const hugo = estudianteIds[3];
  assert.ok(tabla("realizaciones").some(r => r.estudianteId === hugo &&
    r.fInicioProgramada === Date.parse("2026-11-27T10:30:00+01:00") && r.hInicioReal === undefined));
  assert.ok(tabla("realizaciones").some(r => r.hInicioReal !== undefined && r.hFinReal === undefined));
  assert.ok(tabla("realizaciones").some(r => r.hFinReal !== undefined));

  for (const [i, { usuario }] of estudiantesDemo.entries()) {
    assert.equal(await insertEstudiante._handler(ctx, { userId: usuario }), estudianteIds[i]);
  }
  await insertClaseYRelaciones._handler(ctx, { tutorUserId, estudianteIds });
  assert.equal(tabla("estudiantes").length, 6);
  assert.equal(tabla("configuracionesVisuales").length, 6);
  assert.equal(tabla("clases").length, 1);
  assert.equal(tabla("realizaciones").length, 25);
});
