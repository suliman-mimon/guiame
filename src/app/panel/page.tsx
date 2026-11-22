import Link from "next/link";
import TarjetaEstudiante from "@/components/panel/TarjetaEstudiante";
import { IconoMas } from "@/components/panel/Iconos";
import { claseDePrueba, estudiantesDePrueba } from "@/components/panel/datosDePrueba";

// W2 · Mis estudiantes (RF6.3, RF5.1). De momento con datos de prueba;
// GM-22 la conecta a la consulta de Ignacio (GM-15) con la misma forma de datos.

function fechaDeHoy() {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(new Date());
}

export default function MisEstudiantesPage() {
  const estudiantes = estudiantesDePrueba;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-texto">Mis estudiantes</h1>
          <p className="mt-1 text-texto-suave">
            {claseDePrueba} · {fechaDeHoy()}
          </p>
        </div>
        <Link
          href="/panel/actividades/nueva"
          className="flex min-h-11 items-center gap-2 rounded-boton bg-panel-primario px-4 font-semibold text-white transition-colors hover:bg-panel-primario-hover"
        >
          <IconoMas className="h-5 w-5" />
          Nueva actividad
        </Link>
      </header>

      {estudiantes.length === 0 ? (
        <p className="rounded-tarjeta border border-panel-borde bg-panel-superficie p-6 text-texto-suave">
          Todavía no tienes estudiantes asignados. Cuando el administrador te asigne una
          clase, aparecerán aquí.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {estudiantes.map((estudiante) => (
            <li key={estudiante.id} className="flex">
              <div className="flex w-full">
                <TarjetaEstudiante estudiante={estudiante} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
