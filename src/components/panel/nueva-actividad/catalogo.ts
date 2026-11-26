import { pictogramasDePrueba, type Imagen } from "../pictogramasDePrueba";

// Catálogo de pictogramas del asistente (RF2.4). Cuando el seed cargue la tabla
// `imagenes`, `catalogo` pasa a ser lo que devuelva la consulta del catálogo.
export const catalogo: Imagen[] = pictogramasDePrueba;

export function buscarImagen(imagenId: string): Imagen | undefined {
  return catalogo.find((p) => p._id === imagenId);
}
