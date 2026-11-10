import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  classrooms: defineTable({
    name: v.string(),
    schoolName: v.optional(v.string()),
  }),

  tutorProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("tutor"), v.literal("admin")),
    displayName: v.string(),
    classroomIds: v.array(v.id("classrooms")),
  }).index("by_userId", ["userId"]),

  studentProfiles: defineTable({
    userId: v.id("users"),
    classroomId: v.id("classrooms"),
    displayName: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_classroomId", ["classroomId"]),

  displaySettings: defineTable({
    studentProfileId: v.id("studentProfiles"),
    theme: v.union(
      v.literal("crema"),
      v.literal("alto_contraste"),
      v.literal("azul_calma"),
      v.literal("noche"),
    ),
    fontSize: v.union(
      v.literal("normal"),
      v.literal("grande"),
      v.literal("muy_grande"),
    ),
    visualSupport: v.union(
      v.literal("solo_pictograma"),
      v.literal("pictograma_y_texto"),
      v.literal("solo_texto"),
    ),
    updatedBy: v.union(v.literal("student"), v.literal("tutor")),
    updatedAt: v.number(),
  }).index("by_studentProfileId", ["studentProfileId"]),

  pictograms: defineTable({
    label: v.string(),
    keywords: v.array(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.string(),
    arasaacId: v.optional(v.string()),
  }).searchIndex("search_label", {
    searchField: "label",
    filterFields: ["category"],
  }),

  activities: defineTable({
    classroomId: v.id("classrooms"),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("academica"),
      v.literal("profesional"),
      v.literal("familiar"),
      v.literal("del_estudiante"),
    ),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    pictogramId: v.id("pictograms"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  activityAssignments: defineTable({
    activityId: v.id("activities"),
    studentProfileId: v.id("studentProfiles"),
    classroomId: v.id("classrooms"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_student_and_date", ["studentProfileId", "date"])
    .index("by_classroom_and_date", ["classroomId", "date"])
    .index("by_activity", ["activityId"]),

  moodEntries: defineTable({
    studentProfileId: v.id("studentProfiles"),
    classroomId: v.id("classrooms"),
    date: v.string(),
    mood: v.union(
      v.literal("feliz"),
      v.literal("tranquila"),
      v.literal("cansada"),
      v.literal("triste"),
      v.literal("enfadada"),
      v.literal("nerviosa"),
    ),
    recordedAt: v.number(),
  })
    .index("by_student_and_date", ["studentProfileId", "date"])
    .index("by_classroom_and_date", ["classroomId", "date"]),
});
