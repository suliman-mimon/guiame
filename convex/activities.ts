import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSelfStudent } from "./lib/auth";

const ACTIVITY_TYPE = v.union(
  v.literal("academica"),
  v.literal("profesional"),
  v.literal("familiar"),
  v.literal("del_estudiante"),
);

const ASSIGNMENT_STATUS = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

export const myToday = query({
  args: { date: v.string() },
  returns: v.array(
    v.object({
      assignmentId: v.id("activityAssignments"),
      title: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      type: ACTIVITY_TYPE,
      status: ASSIGNMENT_STATUS,
      pictogramLabel: v.string(),
      pictogramImageUrl: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);

    const assignments = await ctx.db
      .query("activityAssignments")
      .withIndex("by_student_and_date", (q) =>
        q.eq("studentProfileId", student._id).eq("date", args.date),
      )
      .take(50);

    const results: {
      assignmentId: (typeof assignments)[number]["_id"];
      title: string;
      startTime: string;
      endTime: string;
      type: "academica" | "profesional" | "familiar" | "del_estudiante";
      status: "pending" | "in_progress" | "completed";
      pictogramLabel: string;
      pictogramImageUrl: string;
    }[] = [];

    for (const assignment of assignments) {
      const activity = await ctx.db.get("activities", assignment.activityId);
      if (activity === null) continue;
      const pictogram = await ctx.db.get("pictograms", activity.pictogramId);

      results.push({
        assignmentId: assignment._id,
        title: activity.title,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        type: activity.type,
        status: assignment.status,
        pictogramLabel: pictogram?.label ?? "",
        pictogramImageUrl: pictogram?.imageUrl ?? "",
      });
    }

    return results;
  },
});

export const myWeek = query({
  args: { startDate: v.string(), endDate: v.string() },
  returns: v.array(
    v.object({
      assignmentId: v.id("activityAssignments"),
      date: v.string(),
      title: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      status: ASSIGNMENT_STATUS,
      pictogramLabel: v.string(),
      pictogramImageUrl: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);

    const assignments = await ctx.db
      .query("activityAssignments")
      .withIndex("by_student_and_date", (q) =>
        q
          .eq("studentProfileId", student._id)
          .gte("date", args.startDate)
          .lte("date", args.endDate),
      )
      .take(200);

    const results: {
      assignmentId: (typeof assignments)[number]["_id"];
      date: string;
      title: string;
      startTime: string;
      endTime: string;
      status: "pending" | "in_progress" | "completed";
      pictogramLabel: string;
      pictogramImageUrl: string;
    }[] = [];

    for (const assignment of assignments) {
      const activity = await ctx.db.get("activities", assignment.activityId);
      if (activity === null) continue;
      const pictogram = await ctx.db.get("pictograms", activity.pictogramId);

      results.push({
        assignmentId: assignment._id,
        date: assignment.date,
        title: activity.title,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        status: assignment.status,
        pictogramLabel: pictogram?.label ?? "",
        pictogramImageUrl: pictogram?.imageUrl ?? "",
      });
    }

    return results;
  },
});

export const markStarted = mutation({
  args: { assignmentId: v.id("activityAssignments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);
    const assignment = await ctx.db.get("activityAssignments", args.assignmentId);
    if (assignment === null || assignment.studentProfileId !== student._id) {
      throw new Error("Not found");
    }

    await ctx.db.patch("activityAssignments", args.assignmentId, {
      status: "in_progress",
      startedAt: Date.now(),
    });
    return null;
  },
});

export const markCompleted = mutation({
  args: { assignmentId: v.id("activityAssignments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);
    const assignment = await ctx.db.get("activityAssignments", args.assignmentId);
    if (assignment === null || assignment.studentProfileId !== student._id) {
      throw new Error("Not found");
    }

    await ctx.db.patch("activityAssignments", args.assignmentId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});
