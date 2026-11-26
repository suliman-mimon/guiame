import AgendaConectada from "@/components/panel/AgendaConectada";

// W3 · Agenda del estudiante (/panel/estudiantes/[id]), conectada a
// convex/panel.ts (GM-16).

export default async function AgendaEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgendaConectada estudianteId={id} />;
}
