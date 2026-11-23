import Link from "next/link";
import AsistenteNuevaActividad from "@/components/panel/nueva-actividad/AsistenteNuevaActividad";
import { nuevoPaso, type BorradorActividad } from "@/components/panel/nueva-actividad/borrador";
import { agendaDePrueba } from "@/components/panel/agendaDePrueba";
import { estudiantesDePrueba } from "@/components/panel/datosDePrueba";
import { hoyEnMadrid } from "@/components/panel/fechas";

// W4 · /panel/actividades/nueva
//   ?estudiante=<id>&fecha=YYYY-MM-DD  → llega desde «Añadir actividad» en W3
//   ?editar=<id de realización>        → llega desde «Editar» en W3 (RF2.2)

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function NuevaActividadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const estudiante = texto(parametros.estudiante);
  const fecha = texto(parametros.fecha);
  const editar = texto(parametros.editar);
  const hoy = hoyEnMadrid();

  const vacio: BorradorActividad = {
    titulo: "",
    descripcion: "",
    tipo: null,
    arasaacId: null,
    fecha: fecha && fecha >= hoy ? fecha : hoy,
    inicio: "",
    fin: "",
    pasos: [nuevoPaso()],
    estudiantes: estudiante && estudiantesDePrueba.some((e) => e.id === estudiante) ? [estudiante] : [],
  };

  if (editar) {
    // Datos de prueba: GM-11 traerá la actividad y sus pasos del servidor.
    const actividad = agendaDePrueba.find((a) => a.id === editar);
    if (!actividad) {
      return (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-bold text-texto">No encontramos esa actividad</h1>
          <Link href="/panel" className="font-bold text-panel-primario underline underline-offset-2">
            Volver a Mis estudiantes
          </Link>
        </div>
      );
    }
    if (actividad.estado === "hecha") {
      return (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-bold text-texto">Esta actividad ya está hecha</h1>
          <p className="text-texto-suave">Las actividades completadas no se pueden modificar (RF2.2).</p>
          <Link href="/panel" className="font-bold text-panel-primario underline underline-offset-2">
            Volver a Mis estudiantes
          </Link>
        </div>
      );
    }
    const borrador: BorradorActividad = {
      ...vacio,
      titulo: actividad.titulo,
      tipo: "academica",
      arasaacId: actividad.arasaacId,
      fecha: hoy,
      inicio: actividad.inicio,
      fin: actividad.fin,
      pasos: actividad.medios.map((medio, i) => ({
        ...nuevoPaso(medio),
        texto: `Paso ${i + 1} de ${actividad.titulo.toLowerCase()}`,
        arasaacId: medio === "pictograma" ? actividad.arasaacId : undefined,
        archivo: medio === "pictograma" ? undefined : { nombre: `${medio}-paso-${i + 1}.${medio === "video" ? "mp4" : "mp3"}`, tamano: 2_400_000 },
      })),
      estudiantes: ["lucia"],
    };
    return (
      <AsistenteNuevaActividad inicial={borrador} estudiantes={estudiantesDePrueba} editandoId={editar} />
    );
  }

  return <AsistenteNuevaActividad inicial={vacio} estudiantes={estudiantesDePrueba} editandoId={null} />;
}
