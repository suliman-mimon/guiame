"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

// Pictogramas de las actividades y los pasos de la app del alumno. Se piden a
// Convex por id (imagenes:porIds). Los de ARASAAC se sirven desde su API, que
// responde mejor que static.arasaac.org.

export type PictogramaAlumno = { url: string; alt: string; arasaacId: string | null };

function url(imagen: { ubicacionArchivo: string; arasaacId?: string }) {
  return imagen.arasaacId
    ? `https://api.arasaac.org/v1/pictograms/${imagen.arasaacId}?download=false`
    : imagen.ubicacionArchivo;
}

/** Mapa de id de imagen → pictograma listo para pintar. */
export function usePictogramas(
  ids: Array<Id<"imagenes"> | undefined>,
): Map<string, PictogramaAlumno> {
  const unicos = [...new Set(ids.filter((id): id is Id<"imagenes"> => id !== undefined))].sort();
  const imagenes = useQuery(api.imagenes.porIds, unicos.length > 0 ? { ids: unicos } : "skip");
  const mapa = new Map<string, PictogramaAlumno>();
  for (const imagen of imagenes ?? []) {
    if (!url(imagen)) continue;
    mapa.set(imagen._id, {
      url: url(imagen),
      alt: imagen.textoAlternativo,
      arasaacId: imagen.arasaacId ?? null,
    });
  }
  return mapa;
}
