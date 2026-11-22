import Link from "next/link";
import { IconoAviso } from "./Iconos";
import type { EstudianteResumen } from "./datosDePrueba";

// Tarjeta de un estudiante en W2 «Mis estudiantes» (Figma): iniciales, nombre,
// actividad actual, progreso del día y botón para abrir su agenda (W3).
// Si va con retraso, la tarjeta se marca en rojo con el aviso (RF5.1).

export default function TarjetaEstudiante({
  estudiante,
}: {
  estudiante: EstudianteResumen;
}) {
  const { id, nombre, inicialApellido, actividadActual, hechas, total, retraso } =
    estudiante;
  const nombreCorto = `${nombre} ${inicialApellido}.`;
  const iniciales = `${nombre[0]}${inicialApellido}`.toUpperCase();
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0;

  return (
    <article
      aria-labelledby={`estudiante-${id}`}
      className={`flex w-full flex-col gap-4 rounded-tarjeta border bg-panel-superficie p-5 ${
        retraso ? "border-2 border-alerta" : "border-panel-borde"
      }`}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel-primario-suave font-semibold text-panel-primario"
        >
          {iniciales}
        </span>
        <h2 id={`estudiante-${id}`} className="text-lg font-semibold text-texto">
          {nombreCorto}
        </h2>
      </header>

      <div className="flex flex-col gap-1">
        {retraso ? (
          <p className="flex w-fit items-center gap-1.5 rounded-full bg-alerta px-2.5 py-1 text-sm font-bold text-white">
            <IconoAviso className="h-4 w-4" />
            {retraso.actividad} · {retraso.minutos} min tarde
          </p>
        ) : actividadActual ? (
          <>
            <p className="text-sm text-texto-suave">
              {actividadActual.momento === "ahora" ? "Ahora" : "Siguiente"}
            </p>
            <p className="font-semibold text-texto">{actividadActual.titulo}</p>
          </>
        ) : (
          <p className="text-sm text-texto-suave">Sin actividades pendientes hoy</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-texto-suave">
          {hechas} de {total} actividades hechas
        </p>
        <div
          role="progressbar"
          aria-label={`Progreso de ${nombreCorto}`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={hechas}
          aria-valuetext={`${hechas} de ${total} actividades hechas`}
          className="h-2 overflow-hidden rounded-full bg-panel-pista"
        >
          <div
            className="h-full rounded-full bg-panel-primario"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <Link
        href={`/panel/estudiantes/${id}`}
        className="mt-auto flex min-h-11 items-center justify-center rounded-boton bg-panel-primario px-4 font-semibold text-white transition-colors hover:bg-panel-primario-hover"
      >
        Abrir su agenda
        <span className="sr-only"> de {nombreCorto}</span>
      </Link>
    </article>
  );
}
