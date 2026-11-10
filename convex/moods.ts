import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSelfStudent } from "./lib/auth";

const MOOD = v.union(
  v.literal("feliz"),
  v.literal("tranquila"),
  v.literal("cansada"),
  v.literal("triste"),
  v.literal("enfadada"),
  v.literal("nerviosa"),
);

export const getTodayForStudent = query({
  args: { date: v.string() },
  returns: v.union(v.null(), v.object({ mood: MOOD, recordedAt: v.number() })),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);
    const entry = await ctx.db
      .query("moodEntries")
      .withIndex("by_student_and_date", (q) =>
        q.eq("studentProfileId", student._id).eq("date", args.date),
      )
      .unique();
    if (entry === null) return null;
    return { mood: entry.mood, recordedAt: entry.recordedAt };
  },
});

export const setToday = mutation({
  args: { date: v.string(), mood: MOOD },
  returns: v.null(),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);
    const existing = await ctx.db
      .query("moodEntries")
      .withIndex("by_student_and_date", (q) =>
        q.eq("studentProfileId", student._id).eq("date", args.date),
      )
      .unique();
    if (existing !== null) {
      throw new Error("Ya has elegido tu estado de ánimo hoy.");
    }

    await ctx.db.insert("moodEntries", {
      studentProfileId: student._id,
      classroomId: student.classroomId,
      date: args.date,
      mood: args.mood,
      recordedAt: Date.now(),
    });
    return null;
  },
});
