"use client";

import { createContext, useContext } from "react";
import type { Imagen } from "../pictogramasDePrueba";

// Catálogo de pictogramas del sistema (RF2.4). Lo carga una vez el asistente
// desde Convex (imagenes:catalogo) y lo comparten sus pasos y el selector.

const CatalogoContext = createContext<Imagen[]>([]);

export function CatalogoProvider({
  catalogo,
  children,
}: {
  catalogo: Imagen[];
  children: React.ReactNode;
}) {
  return <CatalogoContext.Provider value={catalogo}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo() {
  const catalogo = useContext(CatalogoContext);
  return {
    catalogo,
    buscarImagen: (imagenId: string) => catalogo.find((p) => p._id === imagenId),
  };
}
