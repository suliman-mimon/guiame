import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSelfStudent } from "./lib/auth";

const THEME = v.union(
  v.literal("crema"),
  v.literal("alto_contraste"),
  v.literal("azul_calma"),
  v.literal("noche"),
);
const FONT_SIZE = v.union(
  v.literal("normal"),
  v.literal("grande"),
  v.literal("muy_grande"),
);

export const getMine = query({
  args: {},
  returns: v.union(v.null(), v.object({ theme: THEME, fontSize: FONT_SIZE })),
  handler: async (ctx) => {
    const student = await requireSelfStudent(ctx);
    const settings = await ctx.db
      .query("displaySettings")
      .withIndex("by_studentProfileId", (q) =>
        q.eq("studentProfileId", student._id),
      )
      .unique();
    if (settings === null) return null;
    return { theme: settings.theme, fontSize: settings.fontSize };
  },
});

export const updateMine = mutation({
  args: { theme: THEME, fontSize: FONT_SIZE },
  returns: v.null(),
  handler: async (ctx, args) => {
    const student = await requireSelfStudent(ctx);
    const settings = await ctx.db
      .query("displaySettings")
      .withIndex("by_studentProfileId", (q) =>
        q.eq("studentProfileId", student._id),
      )
      .unique();

    if (settings === null) {
      await ctx.db.insert("displaySettings", {
        studentProfileId: student._id,
        theme: args.theme,
        fontSize: args.fontSize,
        visualSupport: "pictograma_y_texto",
        updatedBy: "student",
        updatedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.patch("displaySettings", settings._id, {
      theme: args.theme,
      fontSize: args.fontSize,
      updatedBy: "student",
      updatedAt: Date.now(),
    });
    return null;
  },
});
