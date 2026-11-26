"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import PasoDatos from "./PasoDatos";
import PasoPasos from "./PasoPasos";
import PasoParaQuien from "./PasoParaQuien";
import SelectorPictograma from "./SelectorPictograma";
import { CatalogoProvider } from "./catalogo";
import {
  argumentosParaGuardar,
  buscarSolapamientos,
  validarDatos,
  validarPasos,
  type BorradorActividad,
  type Errores,
  type Ocupada,
} from "./borrador";
import type { EstudianteResumen } from "../datosDePrueba";
import { horaEnMadrid, hoyEnMadrid, minutosAhoraEnMadrid, rangoDelDia } from "../fechas";

// W4 · Asistente «Nueva actividad» en tres pasos: Datos (GM-23), Pasos (GM-25)
// y Para quién con resumen (GM-24, GM-47), conectado a Convex:
//   - el catálogo de pictogramas sale de imagenes:catalogo (RF2.4);
//   - lo que ya tienen ese día los elegidos, de panel:ocupacion, para avisar de
//     solapamientos antes de guardar (RF2.6);
//   - guardar llama a actividades:crear y después a realizaciones:asignar
//     (GM-07, Suliman), que vuelve a comprobar los solapamientos en el servidor.

const PASOS = ["Datos", "Pasos", "Para quién"] as const;

// En producción Convex no deja ver el texto de los errores del servidor, así
// que el mensaje se elige por lo que pudo fallar.
function mensajeDeError(error: unknown) {
  const texto = error instanceof Error ? error.message : "";
  if (texto.includes("solapa")) {
    return "No se ha guardado: el horario se solapa con otra actividad de un estudiante. Cambia la hora y vuelve a intentarlo.";
  }
  if (texto.includes("anterior a la actual")) {
    return "No se ha guardado: esa hora ya ha pasado. Elige una hora más tarde.";
  }
  return "No se ha podido guardar la actividad. Comprueba que el horario no choca con otra actividad y vuelve a intentarlo.";
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
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  const catalogo = useQuery(api.imagenes.catalogo, {});
  const crear = useMutation(api.actividades.crear);
  const asignar = useMutation(api.realizaciones.asignar);
  const ocupacion = useQuery(
    api.panel.ocupacion,
    borrador.fecha && borrador.estudiantes.length > 0
      ? { estudianteIds: borrador.estudiantes, ...rangoDelDia(borrador.fecha) }
      : "skip",
  );

  function agendaDe(estudianteId: string): Ocupada[] {
    const delEstudiante = ocupacion?.find((o) => o.estudianteId === estudianteId);
    return (delEstudiante?.realizaciones ?? []).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      inicio: horaEnMadrid(r.fInicioProgramada),
      fin: horaEnMadrid(r.fFinProgramada),
    }));
  }

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

  const erroresDatos = validarDatos(borrador, hoy, minutosAhoraEnMadrid());
  const erroresPasos = validarPasos(borrador);
  const solapamientos = buscarSolapamientos(borrador, (id) =>
    agendaDe(id).filter((a) => a.id !== editandoId),
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
    setErrorGuardar(null);
    try {
      const args = argumentosParaGuardar(borrador);
      const actividadId = await crear({
        titulo: args.titulo,
        descripcion: args.descripcion,
        tipoActividad: args.tipoActividad,
        imagenId: args.imagenId as Id<"imagenes">,
        // Cada paso lleva siempre su pictograma (HU-03); validarPasos ya lo exige.
        pasos: args.pasos.map((p) => {
          if (!p.imagenId) throw new Error("Falta el pictograma de un paso");
          return { texto: p.texto, tipoMedio: p.tipoMedio, imagenId: p.imagenId as Id<"imagenes"> };
        }),
      });
      await asignar({
        actividadId,
        asignaciones: args.estudianteIds.map((estudianteId) => ({
          estudianteId: estudianteId as Id<"estudiantes">,
          fInicioProgramada: args.fInicioProgramada,
          fFinProgramada: args.fFinProgramada,
        })),
      });
      setGuardado(true);
    } catch (error) {
      setErrorGuardar(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  function elegirPictograma(imagenId: string) {
    if (!selector) return;
    if (selector.destino === "principal") cambiar({ imagenId });
    else {
      cambiar({
        pasos: borrador.pasos.map((p) => (p.id === selector.destino ? { ...p, imagenId } : p)),
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
    <CatalogoProvider catalogo={catalogo ?? []}>
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

      {errorGuardar && (
        <p role="alert" className="rounded-boton border border-alerta p-3 font-bold text-alerta">
          {errorGuardar}
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
    </CatalogoProvider>
  );
}
