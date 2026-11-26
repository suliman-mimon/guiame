import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type CurrentUser =
  | {
      kind: "tutor";
      esAdministrador: boolean;
      userId: Id<"users">;
      tutor: Doc<"tutores">;
    }
  | { kind: "estudiante"; userId: Id<"users">; estudiante: Doc<"estudiantes"> };

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<CurrentUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;

  const tutor = await ctx.db
    .query("tutores")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (tutor !== null) {
    const user = await ctx.db.get("users", userId);
    const esAdministrador = user?.roles?.includes("administrador") ?? false;
    return { kind: "tutor", esAdministrador, userId, tutor };
  }

  const estudiante = await ctx.db
    .query("estudiantes")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (estudiante !== null) {
    return { kind: "estudiante", userId, estudiante };
  }

  return null;
}

export async function requireTutorOrAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<CurrentUser & { kind: "tutor" }> {
  const current = await getCurrentUser(ctx);
  if (current === null || current.kind !== "tutor") {
    throw new Error("No autorizado: se requiere tutor o administrador");
  }
  return current;
}

export async function requireSelfEstudiante(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"estudiantes">> {
  const current = await getCurrentUser(ctx);
  if (current === null || current.kind !== "estudiante") {
    throw new Error("No autorizado: se requiere estudiante");
  }
  return current.estudiante;
}

// Un tutor puede ver a un alumno si tiene un vínculo directo con él o lo
// supervisa a través de alguna de sus clases (en cualquier curso
// académico). El administrador puede ver a cualquier alumno.
export async function requireVeAlEstudianteOrAdmin(
  ctx: QueryCtx | MutationCtx,
  estudianteId: Id<"estudiantes">,
): Promise<Doc<"tutores">> {
  const current = await requireTutorOrAdmin(ctx);
  if (current.esAdministrador) return current.tutor;

  const vinculosDirectos = await ctx.db
    .query("vinculosDirectos")
    .withIndex("by_tutor", (q) => q.eq("tutorId", current.tutor._id))
    .collect();
  if (vinculosDirectos.some((v) => v.estudianteId === estudianteId)) {
    return current.tutor;
  }

  const matriculas = await ctx.db
    .query("matriculas")
    .withIndex("by_estudiante", (q) => q.eq("estudianteId", estudianteId))
    .collect();
  const supervisiones = await ctx.db
    .query("supervisiones")
    .withIndex("by_tutor", (q) => q.eq("tutorId", current.tutor._id))
    .collect();
  const clasesSupervisadas = new Set(supervisiones.map((s) => s.claseId));
  if (matriculas.some((m) => clasesSupervisadas.has(m.claseId))) {
    return current.tutor;
  }

  throw new Error("No autorizado: no supervisas a este alumno");
}
