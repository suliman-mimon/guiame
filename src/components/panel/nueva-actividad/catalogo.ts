import { pictogramasDePrueba, type Pictograma } from "../pictogramasDePrueba";

export function buscarPictogramaPorId(arasaacId: string): Pictograma | undefined {
  return pictogramasDePrueba.find((p) => p.arasaacId === arasaacId);
}
