import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type CurrentUser =
  | { role: "admin" | "tutor"; userId: Id<"users">; tutor: Doc<"tutorProfiles"> }
  | { role: "student"; userId: Id<"users">; student: Doc<"studentProfiles"> };

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<CurrentUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;

  const tutor = await ctx.db
    .query("tutorProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (tutor !== null) {
    return { role: tutor.role, userId, tutor };
  }

  const student = await ctx.db
    .query("studentProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (student !== null) {
    return { role: "student", userId, student };
  }

  return null;
}

export async function requireTutorOrAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"tutorProfiles">> {
  const current = await getCurrentUser(ctx);
  if (current === null || current.role === "student") {
    throw new Error("Not authorized: tutor or admin required");
  }
  return current.tutor;
}

export async function requireOwnsClassroomOrAdmin(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
): Promise<Doc<"tutorProfiles">> {
  const tutor = await requireTutorOrAdmin(ctx);
  if (tutor.role === "admin") return tutor;
  if (!tutor.classroomIds.includes(classroomId)) {
    throw new Error("Not authorized: you do not manage this classroom");
  }
  return tutor;
}

export async function requireSelfStudent(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"studentProfiles">> {
  const current = await getCurrentUser(ctx);
  if (current === null || current.role !== "student") {
    throw new Error("Not authorized: student required");
  }
  return current.student;
}
