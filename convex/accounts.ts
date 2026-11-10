import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";

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
    await createAccount(ctx, {
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
    return null;
  },
});
