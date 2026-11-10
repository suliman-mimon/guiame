import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { getCurrentUser, requireTutorOrAdmin } from "./lib/auth";
import schema from "./schema";

export const currentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      role: v.literal("student"),
      studentProfileId: v.id("studentProfiles"),
      displayName: v.string(),
      classroomId: v.id("classrooms"),
    }),
    v.object({
      role: v.union(v.literal("tutor"), v.literal("admin")),
      tutorProfileId: v.id("tutorProfiles"),
      displayName: v.string(),
      classroomIds: v.array(v.id("classrooms")),
    }),
  ),
  handler: async (ctx) => {
    const current = await getCurrentUser(ctx);
    if (current === null) return null;

    if (current.role === "student") {
      return {
        role: "student" as const,
        studentProfileId: current.student._id,
        displayName: current.student.displayName,
        classroomId: current.student.classroomId,
      };
    }

    return {
      role: current.role,
      tutorProfileId: current.tutor._id,
      displayName: current.tutor.displayName,
      classroomIds: current.tutor.classroomIds,
    };
  },
});

// Used by actions (e.g. students.create) that need to authorize the caller
// as a tutor/admin but cannot read ctx.db directly.
export const getTutorProfileForCurrentUser = internalQuery({
  args: {},
  returns: schema.doc("tutorProfiles"),
  handler: async (ctx) => {
    return await requireTutorOrAdmin(ctx);
  },
});
