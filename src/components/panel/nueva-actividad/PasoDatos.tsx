"use client";

import { useCatalogo } from "./catalogo";
import { MiniaturaPictograma } from "./SelectorPictograma";
import { TIPOS, type BorradorActividad, type Errores } from "./borrador";
import { INICIO_TARDE, aMinutos } from "../fechas";

// Paso 1 · Datos (W4a, RF2.1 y RF2.4): qué actividad es, su pictograma, el tipo y cuándo.

function MensajeError({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="text-sm font-bold text-alerta">
      {texto}
    </p>
  );
}

export default function PasoDatos({
  borrador,
  cambiar,
  errores,
  hoy,
  abrirSelector,
}: {
  borrador: BorradorActividad;
  cambiar: (parcial: Partial<BorradorActividad>) => void;
  errores: Errores;
  hoy: string;
  abrirSelector: () => void;
}) {
  const { buscarImagen } = useCatalogo();
  const pictograma = borrador.imagenId ? buscarImagen(borrador.imagenId) : undefined;
  const parteDelDia =
    borrador.inicio && aMinutos(borrador.inicio) >= INICIO_TARDE ? "de la tarde" : "de la mañana";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="titulo" className="font-bold">
          ¿Qué actividad es?
        </label>
        <input
          id="titulo"
          value={borrador.titulo}
          onChange={(e) => cambiar({ titulo: e.target.value })}
          maxLength={100}
          placeholder="Por ejemplo: Taller de cocina"
          aria-invalid={Boolean(errores.titulo)}
          aria-describedby={errores.titulo ? "error-titulo" : undefined}
          className="min-h-11 rounded-boton border border-panel-borde-campo px-3"
        />
        <MensajeError id="error-titulo" texto={errores.titulo} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-bold" id="etiqueta-pictograma">
          Pictograma principal
        </span>
        <div className="flex items-center gap-4">
          {pictograma ? (
            <>
              <MiniaturaPictograma imagen={pictograma} />
              <span className="capitalize">{pictograma.textoAlternativo}</span>
            </>
          ) : (
            <span className="text-texto-suave">Sin elegir</span>
          )}
          <button
            type="button"
            onClick={abrirSelector}
            aria-describedby={errores.pictograma ? "error-pictograma" : undefined}
            className="min-h-11 rounded-boton border-2 border-panel-primario px-4 font-bold text-panel-primario hover:bg-panel-primario-suave"
          >
            {pictograma ? "Cambiar" : "Elegir pictograma"}
          </button>
        </div>
        <MensajeError id="error-pictograma" texto={errores.pictograma} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => {
            const elegido = borrador.tipo === t.valor;
            return (
              <label
                key={t.valor}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-panel-primario ${
                  elegido
                    ? "border-panel-primario bg-panel-primario-suave text-panel-primario"
                    : "border-panel-borde text-texto"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t.valor}
                  checked={elegido}
                  onChange={() => cambiar({ tipo: t.valor })}
                  className="sr-only"
                />
                {elegido && <span aria-hidden="true">✓</span>}
                {t.texto}
              </label>
            );
          })}
        </div>
        <MensajeError id="error-tipo" texto={errores.tipo} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">¿Cuándo?</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fecha" className="text-sm text-texto-suave">
              Día
            </label>
            <input
              id="fecha"
              type="date"
              min={hoy}
              value={borrador.fecha}
              onChange={(e) => cambiar({ fecha: e.target.value })}
              aria-invalid={Boolean(errores.fecha)}
              aria-describedby={errores.fecha ? "error-fecha" : undefined}
              className="min-h-11 rounded-boton border border-panel-borde-campo px-3"
            />
            <MensajeError id="error-fecha" texto={errores.fecha} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="inicio" className="text-sm text-texto-suave">
              Empieza
            </label>
            <input
              id="inicio"
              type="time"
              value={borrador.inicio}
              onChange={(e) => cambiar({ inicio: e.target.value })}
              aria-invalid={Boolean(errores.inicio)}
              aria-describedby={errores.inicio ? "error-inicio" : undefined}
              className="min-h-11 rounded-boton border border-panel-borde-campo px-3"
            />
            <MensajeError id="error-inicio" texto={errores.inicio} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fin" className="text-sm text-texto-suave">
              Termina
            </label>
            <input
              id="fin"
              type="time"
              value={borrador.fin}
              onChange={(e) => cambiar({ fin: e.target.value })}
              aria-invalid={Boolean(errores.fin)}
              aria-describedby={errores.fin ? "error-fin" : undefined}
              className="min-h-11 rounded-boton border border-panel-borde-campo px-3"
            />
            <MensajeError id="error-fin" texto={errores.fin} />
          </div>
        </div>
        {borrador.inicio && (
          <p className="rounded-boton bg-panel-primario-suave px-3 py-2 text-sm text-panel-primario">
            Aparecerá en la parte {parteDelDia} de su agenda.
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="descripcion" className="font-bold">
          Descripción <span className="font-normal text-texto-suave">(opcional)</span>
        </label>
        <textarea
          id="descripcion"
          value={borrador.descripcion}
          onChange={(e) => cambiar({ descripcion: e.target.value })}
          maxLength={500}
          rows={3}
          className="rounded-boton border border-panel-borde-campo px-3 py-2"
        />
      </div>
    </div>
  );
}
