"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";

export type ConfiguracionVisual = NonNullable<
  FunctionReturnType<typeof api.configuracionesVisuales.miConfiguracion>
>;

export type Tema = Omit<ConfiguracionVisual, "estudianteId"> & {
  cargando: boolean;
};

export const TEMA_POR_DEFECTO: Omit<Tema, "cargando"> = {
  paletaColor: "crema",
  escalaLetra: "normal",
  mostrarPictograma: true,
  mostrarTexto: true,
  mostrarVideo: false,
  mostrarAudio: false,
  rangoEmociones: "basico",
  permiteVerSemana: false,
  permiteCambiarColores: false,
  permiteDecirComoSeSiente: false,
  permiteCrearTareas: false,
};

const TemaContext = createContext<Tema>({
  ...TEMA_POR_DEFECTO,
  cargando: false,
});

export function useTema(): Tema {
  return useContext(TemaContext);
}

export default function TemaProvider({
  children,
  configuracion,
  soloVistaPrevia = false,
}: {
  children: ReactNode;
  configuracion?: Partial<Omit<ConfiguracionVisual, "estudianteId">> | null;
  soloVistaPrevia?: boolean;
}) {
  const desdeServidor = useQuery(
    api.configuracionesVisuales.miConfiguracion,
    configuracion !== undefined ? "skip" : {},
  );
  const fuente = configuracion !== undefined ? configuracion : desdeServidor;
  const tema: Tema = {
    ...TEMA_POR_DEFECTO,
    ...(fuente ?? {}),
    cargando: configuracion === undefined && desdeServidor === undefined,
  };

  if (!tema.mostrarTexto && !tema.mostrarPictograma) {
    tema.mostrarTexto = true;
  }

  useEffect(() => {
    if (soloVistaPrevia) return;
    const html = document.documentElement;
    html.dataset.letra = tema.escalaLetra;
    return () => {
      delete html.dataset.letra;
    };
  }, [soloVistaPrevia, tema.escalaLetra]);

  return (
    <TemaContext.Provider value={tema}>
      <div data-paleta={tema.paletaColor} className="contents">
        {children}
      </div>
    </TemaContext.Provider>
  );
}
