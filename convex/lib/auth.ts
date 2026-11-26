import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export async function requireSelfEstudiante(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"estudiantes">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("No autorizado: inicia sesión como estudiante");
  }

  const user = await ctx.db.get("users", userId);
  if (!user?.roles?.includes("estudiante")) {
    throw new Error("No autorizado: se requiere una cuenta de estudiante");
  }

  const estudiante = await ctx.db
    .query("estudiantes")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (estudiante === null) {
    throw new Error("La cuenta no tiene un perfil de estudiante asociado");
  }

  return estudiante;
}
