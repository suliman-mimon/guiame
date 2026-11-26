import Link from "next/link";
import AgendaEstudiante from "@/components/panel/AgendaEstudiante";
import { estudiantesDePrueba } from "@/components/panel/datosDePrueba";
import { agendaDePrueba, emocionDePrueba } from "@/components/panel/agendaDePrueba";

// W3 · Agenda del estudiante (/panel/estudiantes/[id]). De momento con datos de
// prueba; GM-22 la conecta a la consulta de Ignacio (GM-16) con la misma forma.

export default async function AgendaEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estudiante = estudiantesDePrueba.find((e) => e.id === id);

  if (!estudiante) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <h1 className="text-3xl font-bold text-texto">No encontramos a este estudiante</h1>
        <p className="text-texto-suave">
          Puede que no esté entre tus estudiantes asignados.
        </p>
        <Link href="/panel" className="font-bold text-panel-primario underline underline-offset-2">
          Volver a Mis estudiantes
        </Link>
      </div>
    );
  }

  return (
    <AgendaEstudiante
      estudiante={estudiante}
      agendaDeHoy={agendaDePrueba}
      emocionDeHoy={emocionDePrueba}
    />
  );
}
