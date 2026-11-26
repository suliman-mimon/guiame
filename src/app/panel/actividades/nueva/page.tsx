import NuevaActividadConectada from "@/components/panel/nueva-actividad/NuevaActividadConectada";

// W4 · /panel/actividades/nueva
//   ?estudiante=<id>&fecha=YYYY-MM-DD  → llega desde «Añadir actividad» en W3
// Editar una actividad ya asignada (RF2.2) llega con GM-11.

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function NuevaActividadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  return (
    <NuevaActividadConectada
      estudiante={texto(parametros.estudiante)}
      fecha={texto(parametros.fecha)}
    />
  );
}
