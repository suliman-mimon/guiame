"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PasoDatos from "./PasoDatos";
import PasoPasos from "./PasoPasos";
import PasoParaQuien from "./PasoParaQuien";
import SelectorPictograma from "./SelectorPictograma";
import {
  buscarSolapamientos,
  validarDatos,
  validarPasos,
  type BorradorActividad,
  type Errores,
} from "./borrador";
import { agendaDePrueba, type ActividadDeAgenda } from "../agendaDePrueba";
import type { EstudianteResumen } from "../datosDePrueba";
import { hoyEnMadrid } from "../fechas";

// W4 · Asistente «Nueva actividad» en tres pasos: Datos (GM-23), Pasos (GM-25)
// y Para quién con resumen (GM-24, GM-47).
//
// De momento guarda en local para poder probar el flujo. Al conectar GM-07
// (Suliman): `guardar` llama a la mutación con el borrador y el servidor vuelve a
// comprobar los solapamientos (RF2.6); `agendaDe` pasa a ser una consulta.

const PASOS = ["Datos", "Pasos", "Para quién"] as const;

function agendaDe(estudianteId: string, fecha: string): ActividadDeAgenda[] {
  // Datos de prueba: solo Lucía tiene agenda, y solo hoy.
  return estudianteId === "lucia" && fecha === hoyEnMadrid() ? agendaDePrueba : [];
}

export default function AsistenteNuevaActividad({
  inicial,
  estudiantes,
  editandoId,
}: {
  inicial: BorradorActividad;
  estudiantes: EstudianteResumen[];
  editandoId: string | null;
}) {
  const hoy = hoyEnMadrid();
  const [paso, setPaso] = useState(0);
  const [borrador, setBorrador] = useState(inicial);
  const [intentado, setIntentado] = useState([false, false, false]);
  const [selector, setSelector] = useState<{ destino: "principal" | string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso, guardado]);

  function cambiar(parcial: Partial<BorradorActividad>) {
    setBorrador((b) => ({ ...b, ...parcial }));
  }

  const erroresDatos = validarDatos(borrador, hoy);
  const erroresPasos = validarPasos(borrador);
  const solapamientos = buscarSolapamientos(borrador, (id, fecha) =>
    agendaDe(id, fecha).filter((a) => a.id !== editandoId),
  );
  const erroresParaQuien: Errores =
    borrador.estudiantes.length === 0 ? { estudiantes: "Elige al menos un estudiante." } : {};
  const errores = [erroresDatos, erroresPasos, erroresParaQuien];
  const erroresVisibles = intentado[paso] ? errores[paso] : {};

  function siguiente() {
    setIntentado((v) => v.map((x, i) => (i === paso ? true : x)));
    if (Object.keys(errores[paso]).length === 0) setPaso(paso + 1);
  }

  async function guardar() {
    setIntentado([true, true, true]);
    const pasoConError = errores.findIndex((e) => Object.keys(e).length > 0);
    if (pasoConError >= 0) {
      setPaso(pasoConError);
      return;
    }
    if (solapamientos.length > 0) return;
    setGuardando(true);
    // TODO GM-24: sustituir por la mutación de GM-07 (api.actividades.crear / modificar).
    await new Promise((r) => setTimeout(r, 400));
    setGuardando(false);
    setGuardado(true);
  }

  function elegirPictograma(arasaacId: string) {
    if (!selector) return;
    if (selector.destino === "principal") cambiar({ arasaacId });
    else {
      cambiar({
        pasos: borrador.pasos.map((p) => (p.id === selector.destino ? { ...p, arasaacId } : p)),
      });
    }
    setSelector(null);
  }

  const encabezado =
    paso === 0
      ? editandoId
        ? "Editar actividad"
        : "Nueva actividad"
      : `${borrador.titulo || "Actividad"}: ${paso === 1 ? "pasos" : "para quién"}`;

  if (guardado) {
    const primero = estudiantes.find((e) => e.id === borrador.estudiantes[0]);
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 ref={titulo} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
          {editandoId ? "Actividad actualizada" : "Actividad creada"}
        </h1>
        <p className="rounded-tarjeta border border-exito bg-exito-suave p-5 text-texto">
          «{borrador.titulo}» ya aparece en la agenda de {borrador.estudiantes.length}{" "}
          {borrador.estudiantes.length === 1 ? "estudiante" : "estudiantes"}.
          <br />
          <span className="text-sm text-texto-suave">
            Versión de prueba: se guardará de verdad cuando se conecte con GM-07.
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {primero && (
            <Link
              href={`/panel/estudiantes/${primero.id}`}
              className="flex min-h-11 items-center rounded-boton bg-panel-primario px-4 font-bold text-white hover:bg-panel-primario-hover"
            >
              Ver la agenda de {primero.nombre}
            </Link>
          )}
          <Link
            href="/panel"
            className="flex min-h-11 items-center rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
          >
            Volver a Mis estudiantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <nav aria-label="Ruta" className="text-sm text-texto-suave">
        <Link href="/panel" className="underline underline-offset-2 hover:text-texto">
          Mis estudiantes
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{editandoId ? "Editar actividad" : "Nueva actividad"}</span>
      </nav>

      <h1 ref={titulo} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        {encabezado}
      </h1>

      <ol aria-label="Pasos del asistente" className="flex items-center gap-2">
        {PASOS.map((nombre, i) => (
          <li key={nombre} className="flex flex-1 items-center gap-2" aria-current={i === paso ? "step" : undefined}>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                i < paso
                  ? "bg-panel-primario text-white"
                  : i === paso
                    ? "bg-panel-primario text-white ring-4 ring-panel-primario-suave"
                    : "border-2 border-panel-borde text-texto-suave"
              }`}
            >
              {i < paso ? "✓" : i + 1}
            </span>
            <span className={i === paso ? "font-bold text-texto" : "text-texto-suave"}>{nombre}</span>
            {i < PASOS.length - 1 && <span aria-hidden="true" className="h-0.5 flex-1 bg-panel-borde" />}
          </li>
        ))}
      </ol>

      <section className="rounded-tarjeta border border-panel-borde bg-panel-superficie p-6">
        {paso === 0 && (
          <PasoDatos
            borrador={borrador}
            cambiar={cambiar}
            errores={erroresVisibles}
            hoy={hoy}
            abrirSelector={() => setSelector({ destino: "principal" })}
          />
        )}
        {paso === 1 && (
          <PasoPasos
            borrador={borrador}
            cambiar={cambiar}
            errores={erroresVisibles}
            abrirSelectorDePaso={(id) => setSelector({ destino: id })}
          />
        )}
        {paso === 2 && (
          <PasoParaQuien
            borrador={borrador}
            cambiar={cambiar}
            errores={erroresVisibles}
            estudiantes={estudiantes}
            solapamientos={solapamientos}
          />
        )}
      </section>

      {intentado[paso] && Object.keys(errores[paso]).length > 0 && (
        <p role="alert" className="font-bold text-alerta">
          Revisa los campos marcados antes de seguir.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        {paso === 0 ? (
          <Link
            href="/panel"
            className="flex min-h-11 items-center rounded-boton border-2 border-panel-borde px-4 font-bold text-texto hover:bg-panel-fondo"
          >
            Cancelar
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setPaso(paso - 1)}
            className="flex min-h-11 items-center rounded-boton border-2 border-panel-borde px-4 font-bold text-texto hover:bg-panel-fondo"
          >
            ‹ Atrás
          </button>
        )}
        {paso < 2 ? (
          <button
            type="button"
            onClick={siguiente}
            className="flex min-h-11 items-center rounded-boton bg-panel-primario px-5 font-bold text-white hover:bg-panel-primario-hover"
          >
            Siguiente: {PASOS[paso + 1].toLowerCase()} ›
          </button>
        ) : (
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex min-h-11 items-center rounded-boton bg-panel-primario px-5 font-bold text-white hover:bg-panel-primario-hover disabled:opacity-60"
          >
            {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Guardar actividad"}
          </button>
        )}
      </div>

      <SelectorPictograma
        abierto={selector !== null}
        titulo={selector?.destino === "principal" ? "Pictograma principal" : "Pictograma del paso"}
        onElegir={elegirPictograma}
        onCerrar={() => setSelector(null)}
      />
    </div>
  );
}
