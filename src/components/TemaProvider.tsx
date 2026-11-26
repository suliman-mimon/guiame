"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";

// GM-35 · TemaProvider del alumno (HU-07, RF4.1–RF4.3).
//
// Lee la configuración visual del alumno (configuracionesVisuales.miConfiguracion,
// GM-10) y la aplica a todo lo que envuelve:
//   - Paleta: pone `data-paleta` en su contenedor. Las variables `--alumno-*`
//     de globals.css (GM-34) cambian solas y los componentes que usan las
//     clases `*-alumno-*` se repintan sin tocarlos.
//   - Letra: pone `data-letra` en <html>, porque Tailwind mide en rem.
//   - Formatos y permisos: los expone con useTema() para que cada pantalla
//     decida qué mostrar (pictograma, texto, vídeo, audio, Mi semana…).
//
// Convex es reactivo: cuando el tutor cambia algo en Ajustes (GM-36), la
// consulta se actualiza y la tablet del alumno cambia sin recargar.
//
// Uso en la app del alumno (p. ej. src/app/hoy/layout.tsx):
//   <TemaProvider>{children}</TemaProvider>
//
// Uso en el panel para previsualizar la configuración de un alumno
// (sin consultar al servidor y sin tocar <html>):
//   <TemaProvider configuracion={config} soloVistaPrevia>…</TemaProvider>

export type ConfiguracionVisual = NonNullable<
  FunctionReturnType<typeof api.configuracionesVisuales.miConfiguracion>
>;

export type Tema = Omit<ConfiguracionVisual, "estudianteId"> & {
  /** true mientras llega la configuración del servidor */
  cargando: boolean;
};

// Valores por defecto de RI3.1 (schema.ts): primera paleta, tamaño normal,
// pictograma y texto visibles. Vídeo y audio apagados hasta que el tutor
// los active; los permisos, cerrados hasta que el tutor los dé.
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

const TemaContext = createContext<Tema>({ ...TEMA_POR_DEFECTO, cargando: false });

/** Configuración visual y permisos del alumno que se está mostrando. */
export function useTema(): Tema {
  return useContext(TemaContext);
}

export default function TemaProvider({
  children,
  configuracion,
  soloVistaPrevia = false,
}: {
  children: ReactNode;
  /** Si se pasa, se usa esta en vez de pedir la del alumno con sesión. */
  configuracion?: Partial<Omit<ConfiguracionVisual, "estudianteId">> | null;
  /** No cambia el tamaño de letra de toda la página (para el panel). */
  soloVistaPrevia?: boolean;
}) {
  const desdeServidor = useQuery(
    api.configuracionesVisuales.miConfiguracion,
    configuracion !== undefined ? "skip" : {},
  );

  const fuente = configuracion !== undefined ? configuracion : desdeServidor;
  const cargando = configuracion === undefined && desdeServidor === undefined;

  const tema: Tema = {
    ...TEMA_POR_DEFECTO,
    ...(fuente ?? {}),
    cargando,
  };
  // El esquema no lo impone: si alguien apaga los dos, se muestra el texto.
  if (!tema.mostrarTexto && !tema.mostrarPictograma) tema.mostrarTexto = true;

  const { escalaLetra } = tema;
  useEffect(() => {
    if (soloVistaPrevia) return;
    const html = document.documentElement;
    html.dataset.letra = escalaLetra;
    return () => {
      delete html.dataset.letra;
    };
  }, [escalaLetra, soloVistaPrevia]);

  return (
    <TemaContext.Provider value={tema}>
      {/* display: contents no altera el layout de quien lo use; las variables
          CSS se heredan igual por el árbol. */}
      <div data-paleta={tema.paletaColor} className="contents">
        {children}
      </div>
    </TemaContext.Provider>
  );
}
