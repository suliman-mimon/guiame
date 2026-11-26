import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Sin alta pública (RF6.1): las cuentas las da de alta el administrador
// (RF6.5, iteración 3). Mientras tanto, esta función interna permite crear
// cuentas de prueba solo por CLI: `npx convex run accounts:createTutor
// '{"email":"tutor@centro.es","password":"...","nombre":"...","apellidos":"..."}'`.
export const createTutor = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    nombre: v.string(),
    apellidos: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user }: { user: { _id: Id<"users"> } } = await createAccount(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.password },
      profile: {
        email: args.email,
        name: args.nombre,
        apellidos: args.apellidos,
        roles: ["tutor"],
        estadoCuenta: "activo",
      },
    });
    await ctx.runMutation(internal.accounts.insertTutorProfile, {
      userId: user._id,
    });
    return null;
  },
});

// createAccount (acción) no puede escribir en la base de datos directamente,
// así que la fila en "tutores" se crea en esta mutación interna aparte. Sin
// ella, getCurrentUser no encuentra al tutor y requireTutorOrAdmin falla.
export const insertTutorProfile = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("tutores", { userId: args.userId, esFamiliar: false });
    return null;
  },
});
