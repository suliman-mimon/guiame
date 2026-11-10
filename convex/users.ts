import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import schema from "./schema";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  returns: v.union(v.null(), schema.doc("users")),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get("users", userId);
  },
});
