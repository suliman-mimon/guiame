import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireTutorOrAdmin } from "./lib/auth";
import { ARASAAC_DE_PLACEHOLDER, CATALOGO_ARASAAC, urlArasaac } from "./lib/arasaac";

// Catálogo de pictogramas del sistema (RF2.4, RI2.4) para el asistente
// «Nueva actividad» del panel (W4).

export const imagenValidator = v.object({
  _id: v.id("imagenes"),
  textoAlternativo: v.string(),
  ubicacionArchivo: v.string(),
  arasaacId: v.optional(v.string()),
});

// Pictogramas de ARASAAC que hay en `imagenes`, uno por pictograma y en orden
// alfabético. El tutor elige de aquí el pictograma principal y el de cada paso.
export const catalogo = query({
  args: {},
  returns: v.array(imagenValidator),
  handler: async (ctx) => {
    await requireTutorOrAdmin(ctx);
    // La tabla es pequeña (el catálogo y las imágenes del seed).
    const imagenes = await ctx.db.query("imagenes").take(2000);
    const vistos = new Set<string>();
    const resultado = [];
    for (const imagen of imagenes) {
      if (imagen.arasaacId === undefined || vistos.has(imagen.arasaacId)) continue;
      vistos.add(imagen.arasaacId);
      resultado.push({
        _id: imagen._id,
        textoAlternativo: imagen.textoAlternativo,
        ubicacionArchivo: imagen.ubicacionArchivo,
        arasaacId: imagen.arasaacId,
      });
    }
    return resultado.sort((a, b) => a.textoAlternativo.localeCompare(b.textoAlternativo, "es"));
  },
});

// Las imágenes que pide una pantalla (pictogramas de actividades y pasos), para
// cualquiera con sesión: el alumno las necesita en «Hoy» y en el paso a paso.
export const porIds = query({
  args: { ids: v.array(v.id("imagenes")) },
  returns: v.array(imagenValidator),
  handler: async (ctx, { ids }) => {
    if ((await getAuthUserId(ctx)) === null) {
      throw new Error("No autorizado: inicia sesión");
    }
    if (ids.length > 200) throw new Error("Demasiadas imágenes en una sola consulta");
    const resultado = [];
    for (const id of new Set(ids)) {
      const imagen = await ctx.db.get("imagenes", id);
      if (imagen === null) continue;
      resultado.push({
        _id: imagen._id,
        textoAlternativo: imagen.textoAlternativo,
        ubicacionArchivo: imagen.ubicacionArchivo,
        arasaacId: imagen.arasaacId,
      });
    }
    return resultado;
  },
});

// Añade los pictogramas del catálogo que falten y arregla las imágenes
// provisionales del seed (/placeholder/...), que no existen, apuntándolas a su
// pictograma de ARASAAC. Se puede repetir sin duplicar nada.
export async function asegurarCatalogo(ctx: MutationCtx): Promise<void> {
  const imagenes = await ctx.db.query("imagenes").take(2000);
  const conArasaac = new Set(
    imagenes.flatMap((i) => (i.arasaacId === undefined ? [] : [i.arasaacId])),
  );

  const textoDelCatalogo = new Map(CATALOGO_ARASAAC.map(([texto, id]) => [id, texto]));

  for (const imagen of imagenes) {
    if (!imagen.ubicacionArchivo.startsWith("/placeholder/")) continue;
    const arasaacId = ARASAAC_DE_PLACEHOLDER[imagen.textoAlternativo];
    if (arasaacId === undefined) continue;
    await ctx.db.patch("imagenes", imagen._id, {
      arasaacId,
      ubicacionArchivo: urlArasaac(arasaacId),
      textoAlternativo:
        textoDelCatalogo.get(arasaacId) ?? imagen.textoAlternativo.split("_").join(" "),
    });
    conArasaac.add(arasaacId);
  }

  for (const [texto, arasaacId] of CATALOGO_ARASAAC) {
    if (conArasaac.has(arasaacId)) continue;
    await ctx.db.insert("imagenes", {
      textoAlternativo: texto,
      ubicacionArchivo: urlArasaac(arasaacId),
      arasaacId,
    });
    conArasaac.add(arasaacId);
  }
}

// `npx convex run imagenes:sembrarCatalogo`
export const sembrarCatalogo = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await asegurarCatalogo(ctx);
    return null;
  },
});
