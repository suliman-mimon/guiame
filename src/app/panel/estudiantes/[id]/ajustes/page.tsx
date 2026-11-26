import AjustesEstudiante from "@/components/panel/AjustesEstudiante";

// GM-36 · Ajustes del estudiante (/panel/estudiantes/[id]/ajustes).
// Se llega desde el botón «Ajustes» de su agenda (W3).

export default async function AjustesEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AjustesEstudiante id={id} />;
}
