import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Dev-only: wipes every table, including auth accounts, so `seed.ts` can be
// rerun from a clean slate. Never exposed as a public mutation.

const TABLES = [
  "classrooms",
  "tutorProfiles",
  "studentProfiles",
  "displaySettings",
  "pictograms",
  "activities",
  "activityAssignments",
  "moodEntries",
  "users",
  "authSessions",
  "authAccounts",
  "authRefreshTokens",
  "authVerificationCodes",
  "authVerifiers",
  "authRateLimits",
] as const;

export const wipeAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const table of TABLES) {
      for (;;) {
        const batch = await ctx.db.query(table).take(200);
        if (batch.length === 0) break;
        for (const doc of batch) {
          await ctx.db.delete(table, doc._id);
        }
      }
    }
    return null;
  },
});
