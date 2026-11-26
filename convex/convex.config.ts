import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: { GUIAME_DEMO_PASSWORD: v.optional(v.string()) },
});
