// Pictogramas de ARASAAC (https://arasaac.org), con licencia CC BY-NC-SA:
// autor Sergio Palao, propiedad del Gobierno de Aragón.
//
// Se sirven desde la API oficial y no desde static.arasaac.org, que a veces
// responde 504 a next/image.

export function urlArasaac(arasaacId: string): string {
  return `https://api.arasaac.org/v1/pictograms/${arasaacId}?download=false`;
}

// Catálogo del sistema para el asistente «Nueva actividad» (RF2.4: el tutor
// solo elige pictogramas de este catálogo, no sube imágenes propias).
export const CATALOGO_ARASAAC: ReadonlyArray<readonly [texto: string, arasaacId: string]> = [
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
  ["cepillarse los dientes", "2694"],
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
  ["cuaderno", "2359"],
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

// El seed de demo (GM-05) guarda imágenes provisionales en /placeholder/, que
// no existen. Este mapa da el pictograma ARASAAC real de cada una, por su
// textoAlternativo, para repararlas (demo:prepararDia).
export const ARASAAC_DE_PLACEHOLDER: Readonly<Record<string, string>> = {
  desayuno: "4626",
  lavarse_manos: "8977",
  comer: "6456",
  cepillo_dientes: "2694",
  matematicas: "32554",
  cuaderno: "2359",
  recreo: "33064",
  feliz: "35533",
  triste: "35545",
  enfadado: "35539",
  sorprendido: "35529",
  asustado: "35535",
  tranquilo: "31310",
};
