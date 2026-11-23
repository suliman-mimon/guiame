// Catálogo de pictogramas de prueba (ARASAAC), el mismo que usaba el seed antiguo.
// RF2.4: solo se eligen pictogramas del catálogo del sistema. Cuando el seed de
// GM-05/GM-14 cargue la tabla `imagenes`, este catálogo se sustituye por una
// consulta que devuelva esos documentos tal cual (`Imagen`).

/**
 * Lo que las pantallas usan de un documento de la tabla `imagenes` (RI2.4,
 * esquema v2). Las actividades y los pasos guardan `imagenId`, así que el
 * asistente tiene que quedarse con `_id` para mandárselo a la mutación de GM-07.
 */
export type Imagen = {
  /** `Id<"imagenes">` en el servidor. */
  _id: string;
  /** Nombre que se ve en el buscador y texto alternativo. */
  textoAlternativo: string;
  ubicacionArchivo: string;
  arasaacId?: string;
};

// La API oficial de ARASAAC sirve el PNG (500 px). static.arasaac.org no siempre
// responde (da 504 a next/image), así que si la imagen es de ARASAAC usamos la
// API aunque `ubicacionArchivo` apunte a otro sitio.
function urlArasaac(arasaacId: string) {
  return `https://api.arasaac.org/v1/pictograms/${arasaacId}?download=false`;
}

export function urlDeImagen(imagen: Imagen) {
  return imagen.arasaacId ? urlArasaac(imagen.arasaacId) : imagen.ubicacionArchivo;
}

const lista: [string, string][] = [
  ["entrar a clase", "9815"],
  ["asamblea", "27574"],
  ["descanso", "24503"],
  ["recreo", "33064"],
  ["fila", "7102"],
  ["mochila", "2475"],
  ["agenda", "5898"],
  ["reloj", "2549"],
  ["autobús", "2262"],
  ["casa", "6964"],
  ["desayuno", "4626"],
  ["comedor", "5970"],
  ["almuerzo", "28207"],
  ["merienda", "4695"],
  ["fruta", "28339"],
  ["agua", "32464"],
  ["comer", "6456"],
  ["cocinar", "2342"],
  ["pan", "2494"],
  ["baño", "6929"],
  ["ducha", "32426"],
  ["lavarse las manos", "8977"],
  ["cepillarse los dientes", "26744"],
  ["peinarse", "2852"],
  ["matemáticas", "32554"],
  ["lengua", "2944"],
  ["inglés", "32705"],
  ["ciencias naturales", "35437"],
  ["geografía", "5505"],
  ["música", "24791"],
  ["educación física", "31945"],
  ["plástica", "7794"],
  ["leer", "7141"],
  ["escribir", "2380"],
  ["dibujo", "11238"],
  ["pintar", "2348"],
  ["bailar", "35747"],
  ["juego", "36405"],
  ["puzzle", "2540"],
  ["cuento", "2364"],
  ["ordenador", "7190"],
  ["parque", "2859"],
  ["deporte", "7010"],
  ["logopedia", "32428"],
  ["fisioterapia", "5998"],
  ["psicología", "39880"],
  ["terapia ocupacional", "24821"],
  ["familia", "38351"],
  ["comunicación", "9870"],
  ["pregunta", "7217"],
  ["ayuda", "12252"],
  ["esperar", "36914"],
  ["silencio", "5936"],
];

export const pictogramasDePrueba: Imagen[] = lista.map(([texto, arasaacId]) => ({
  _id: `imagen_${arasaacId}`,
  textoAlternativo: texto,
  ubicacionArchivo: urlArasaac(arasaacId),
  arasaacId,
}));

/** Pictograma de prueba por su número de ARASAAC (para montar los datos de prueba). */
export function pictogramaDePrueba(arasaacId: string): Imagen {
  return (
    pictogramasDePrueba.find((p) => p.arasaacId === arasaacId) ?? {
      _id: `imagen_${arasaacId}`,
      textoAlternativo: "",
      ubicacionArchivo: urlArasaac(arasaacId),
      arasaacId,
    }
  );
}
