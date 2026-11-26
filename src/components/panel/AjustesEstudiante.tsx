"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import TemaProvider, { type ConfiguracionVisual } from "@/components/TemaProvider";

// GM-36 · Ajustes del estudiante (HU-07, RF4.1–RF4.3), en el panel del tutor.
// GM-48 · Permisos del alumno y rango de emociones (HU-08), en la misma pantalla.
//
// La tutora elige paleta, tamaño de letra y formatos (un botón por formato).
// Cada clic se guarda al momento con configuracionesVisuales.actualizar (GM-10)
// y, como Convex es reactivo, la tablet del alumno —envuelta en el
// TemaProvider (GM-35)— cambia sin recargar. A la derecha, una vista previa
// con el mismo TemaProvider en modo soloVistaPrevia.

type Paleta = ConfiguracionVisual["paletaColor"];
type Letra = ConfiguracionVisual["escalaLetra"];
type Formato = "mostrarPictograma" | "mostrarTexto" | "mostrarVideo" | "mostrarAudio";

const PALETAS: { id: Paleta; nombre: string; detalle: string }[] = [
  { id: "crema", nombre: "Crema", detalle: "La de siempre" },
  { id: "alto_contraste", nombre: "Alto contraste", detalle: "Negro y amarillo" },
  { id: "azul_calma", nombre: "Azul calma", detalle: "Azules suaves" },
  { id: "noche", nombre: "Noche", detalle: "Fondo oscuro, menos brillo" },
];

const LETRAS: { id: Letra; nombre: string; porcentaje: string; muestra: string }[] = [
  { id: "normal", nombre: "Normal", porcentaje: "100 %", muestra: "text-xl" },
  { id: "grande", nombre: "Grande", porcentaje: "125 %", muestra: "text-2xl" },
  { id: "muy_grande", nombre: "Muy grande", porcentaje: "150 %", muestra: "text-3xl" },
];

const FORMATOS: { id: Formato; nombre: string; icono: string }[] = [
  { id: "mostrarPictograma", nombre: "Pictograma", icono: "🖼" },
  { id: "mostrarTexto", nombre: "Texto", icono: "Aa" },
  { id: "mostrarVideo", nombre: "Vídeo", icono: "▶" },
  { id: "mostrarAudio", nombre: "Audio", icono: "♪" },
];

// GM-48 · Permisos del alumno (HU-08). Cada interruptor habilita algo en su app:
// Mi semana (GM-32), Mis colores (GM-37), Mi estado de ánimo (GM-33) y crear
// sus propias tareas (GM-49).
type Permiso =
  | "permiteVerSemana"
  | "permiteCambiarColores"
  | "permiteDecirComoSeSiente"
  | "permiteCrearTareas";

const PERMISOS: { id: Permiso; nombre: string; detalle: string }[] = [
  { id: "permiteVerSemana", nombre: "Ver su semana", detalle: "Muestra «Mi semana» en su menú" },
  { id: "permiteCambiarColores", nombre: "Cambiar sus colores", detalle: "Puede elegir paleta y letra en «Mis colores»" },
  { id: "permiteDecirComoSeSiente", nombre: "Decir cómo se siente", detalle: "Muestra «Mi estado de ánimo»" },
  { id: "permiteCrearTareas", nombre: "Crear sus propias tareas", detalle: "Puede añadir tareas a su agenda" },
];

type Rango = ConfiguracionVisual["rangoEmociones"];
const RANGOS: { id: Rango; nombre: string; detalle: string }[] = [
  { id: "basico", nombre: "Básico", detalle: "3 emociones" },
  { id: "ampliado", nombre: "Ampliado", detalle: "6 emociones" },
];

// Los ids de Convex son cadenas de 31–32 letras minúsculas y dígitos. Mientras
// el panel use datos de prueba (ids como "lucia"), no hay alumno real que leer.
function pareceIdDeConvex(id: string) {
  return /^[a-z0-9]{31,32}$/.test(id);
}

export default function AjustesEstudiante({ id }: { id: string }) {
  if (!pareceIdDeConvex(id)) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <h1 className="text-3xl font-bold text-texto">Ajustes</h1>
        <p className="text-texto-suave">
          Este estudiante todavía es de datos de prueba y no tiene configuración
          guardada. Los ajustes funcionarán cuando el panel esté conectado a Convex.
        </p>
        <Link href="/panel" className="font-bold text-panel-primario underline underline-offset-2">
          Volver a Mis estudiantes
        </Link>
      </div>
    );
  }
  return <Formulario estudianteId={id as Id<"estudiantes">} />;
}

function Formulario({ estudianteId }: { estudianteId: Id<"estudiantes"> }) {
  const config = useQuery(api.configuracionesVisuales.obtener, { estudianteId });
  const actualizar = useMutation(api.configuracionesVisuales.actualizar);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado" | string>("");

  async function guardar(cambios: Partial<Omit<ConfiguracionVisual, "estudianteId">>) {
    setEstado("guardando");
    try {
      await actualizar({ estudianteId, ...cambios });
      setEstado("guardado");
    } catch (e) {
      setEstado(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  if (config === undefined) {
    return <p className="text-texto-suave">Cargando ajustes…</p>;
  }
  if (config === null) {
    return (
      <p className="text-texto-suave">
        Este estudiante todavía no tiene configuración visual.
      </p>
    );
  }

  // Si solo queda uno de los dos (texto o pictograma), no se puede apagar (RF4.3).
  const bloqueado = (f: Formato) =>
    (f === "mostrarTexto" && config.mostrarTexto && !config.mostrarPictograma) ||
    (f === "mostrarPictograma" && config.mostrarPictograma && !config.mostrarTexto);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/panel/estudiantes/${estudianteId}`}
            className="text-texto-suave underline underline-offset-2 hover:text-texto"
          >
            ← Volver a su agenda
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-texto">Ajustes del estudiante</h1>
          <p className="text-texto-suave">
            Los cambios se guardan al momento y llegan a su tablet sin recargar.
          </p>
        </div>
        <p role="status" aria-live="polite" className="min-h-6 font-bold">
          {estado === "guardando" && <span className="text-texto-suave">Guardando…</span>}
          {estado === "guardado" && <span className="text-exito">✓ Guardado</span>}
          {estado !== "" && estado !== "guardando" && estado !== "guardado" && (
            <span className="text-alerta">{estado}</span>
          )}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="t-colores" className="flex flex-col gap-3">
            <h2 id="t-colores" className="text-xl font-bold text-texto">Colores</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {PALETAS.map((p) => {
                const activa = config.paletaColor === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => guardar({ paletaColor: p.id })}
                    className={`flex flex-col gap-2 rounded-tarjeta border-2 p-3 text-left ${
                      activa
                        ? "border-panel-primario bg-panel-primario-suave"
                        : "border-panel-borde bg-panel-superficie hover:border-texto-suave"
                    }`}
                  >
                    <TemaProvider configuracion={{ paletaColor: p.id }} soloVistaPrevia>
                      <span className="flex items-center gap-2 rounded-xl bg-alumno-fondo p-2">
                        <span className="h-6 w-6 rounded-md bg-alumno-lateral" />
                        <span className="flex-1 text-sm font-bold text-alumno-texto">Comedor</span>
                        <span className="rounded-md bg-alumno-primario px-2 text-sm text-alumno-sobre-primario">
                          ▶
                        </span>
                      </span>
                    </TemaProvider>
                    <span className="font-bold text-texto">{p.nombre}</span>
                    <span className="text-sm text-texto-suave">{p.detalle}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="t-letra" className="flex flex-col gap-3">
            <h2 id="t-letra" className="text-xl font-bold text-texto">Tamaño de letra</h2>
            <div className="grid grid-cols-3 gap-3">
              {LETRAS.map((l) => {
                const activa = config.escalaLetra === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => guardar({ escalaLetra: l.id })}
                    className={`flex flex-col items-center gap-1 rounded-tarjeta border-2 p-4 ${
                      activa
                        ? "border-panel-primario bg-panel-primario-suave"
                        : "border-panel-borde bg-panel-superficie hover:border-texto-suave"
                    }`}
                  >
                    <span className={`${l.muestra} font-bold text-texto`}>Aa</span>
                    <span className="font-bold text-texto">{l.nombre}</span>
                    <span className="text-sm text-texto-suave">{l.porcentaje}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="t-formatos" className="flex flex-col gap-3">
            <h2 id="t-formatos" className="text-xl font-bold text-texto">Formatos</h2>
            <p className="text-texto-suave">
              Un botón por formato. Siempre queda visible el texto o el pictograma.
            </p>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {FORMATOS.map((f) => {
                const activo = config[f.id];
                const noSePuedeApagar = bloqueado(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={activo}
                    disabled={noSePuedeApagar}
                    title={noSePuedeApagar ? "Debe quedar visible el texto o el pictograma" : undefined}
                    onClick={() => guardar({ [f.id]: !activo })}
                    className={`flex min-h-16 items-center gap-3 rounded-boton border-2 px-4 py-2 font-bold disabled:cursor-not-allowed ${
                      activo
                        ? "border-panel-primario bg-panel-primario text-white"
                        : "border-panel-borde bg-panel-superficie text-texto hover:border-texto-suave"
                    }`}
                  >
                    <span aria-hidden className="text-xl">{f.icono}</span>
                    <span className="flex flex-1 flex-col text-left">
                      <span>{f.nombre}</span>
                      <span className="text-sm font-normal">{activo ? "Activado" : "Desactivado"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="t-permisos" className="flex flex-col gap-3">
            <h2 id="t-permisos" className="text-xl font-bold text-texto">Permisos</h2>
            <p className="text-texto-suave">Qué puede hacer por su cuenta en su tablet.</p>
            <ul className="flex flex-col divide-y divide-panel-borde rounded-tarjeta border border-panel-borde bg-panel-superficie">
              {PERMISOS.map((p) => {
                const activo = config[p.id];
                return (
                  <li key={p.id} className="flex items-center gap-4 p-4">
                    <span className="flex flex-1 flex-col">
                      <span id={`lbl-${p.id}`} className="font-bold text-texto">{p.nombre}</span>
                      <span className="text-sm text-texto-suave">{p.detalle}</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={activo}
                      aria-labelledby={`lbl-${p.id}`}
                      onClick={() => guardar({ [p.id]: !activo })}
                      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition ${
                        activo
                          ? "border-panel-primario bg-panel-primario"
                          : "border-texto-suave bg-panel-pista"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${
                          activo ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span aria-hidden className="w-10 text-sm font-bold text-texto-suave">
                      {activo ? "Sí" : "No"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <fieldset className="mt-2 flex flex-col gap-2">
              <legend className="font-bold text-texto">Emociones para elegir</legend>
              <div className="grid grid-cols-2 gap-3">
                {RANGOS.map((r) => {
                  const activo = config.rangoEmociones === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => guardar({ rangoEmociones: r.id })}
                      className={`flex flex-col items-start rounded-tarjeta border-2 p-4 text-left ${
                        activo
                          ? "border-panel-primario bg-panel-primario-suave"
                          : "border-panel-borde bg-panel-superficie hover:border-texto-suave"
                      }`}
                    >
                      <span className="font-bold text-texto">{r.nombre}</span>
                      <span className="text-sm text-texto-suave">{r.detalle}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </section>
        </div>

        <aside aria-label="Vista previa" className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Así lo verá</h2>
          <TemaProvider configuracion={config} soloVistaPrevia>
            <div className="flex flex-col gap-3 rounded-tarjeta border border-panel-borde bg-alumno-fondo p-4 text-alumno-texto">
              <span className="w-fit rounded-full bg-alumno-acento px-3 py-1 text-sm font-bold text-alumno-sobre-acento">
                Ahora
              </span>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-alumno-primario bg-alumno-superficie p-3">
                {config.mostrarPictograma && (
                  <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-xl bg-alumno-lateral text-2xl">
                    🍽
                  </span>
                )}
                {config.mostrarTexto && (
                  <span className="flex-1">
                    <span className="block font-bold" style={{ fontSize: escalaPx(config.escalaLetra, 18) }}>
                      Comedor
                    </span>
                    <span className="block text-alumno-texto-suave" style={{ fontSize: escalaPx(config.escalaLetra, 14) }}>
                      12:00 – 13:00
                    </span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {config.mostrarVideo && (
                  <span className="rounded-lg bg-alumno-primario px-3 py-1 text-sm font-bold text-alumno-sobre-primario">▶ Vídeo</span>
                )}
                {config.mostrarAudio && (
                  <span className="rounded-lg bg-alumno-primario px-3 py-1 text-sm font-bold text-alumno-sobre-primario">♪ Audio</span>
                )}
              </div>
              <span className="rounded-xl bg-alumno-primario px-4 py-3 text-center font-bold text-alumno-sobre-primario">
                Empiezo
              </span>
            </div>
          </TemaProvider>
        </aside>
      </div>
    </div>
  );
}

// En la vista previa no se toca <html>, así que la escala se simula aquí.
function escalaPx(letra: Letra, base: number) {
  const factor = letra === "grande" ? 1.25 : letra === "muy_grande" ? 1.5 : 1;
  return `${base * factor}px`;
}
