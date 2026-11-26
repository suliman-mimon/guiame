import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";

const isPublicRoute = createRouteMatcher(["/login"]);
const isPanelRoute = createRouteMatcher(["/panel", "/panel(.*)"]);
const isHoyRoute = createRouteMatcher(["/hoy", "/hoy(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (!(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  const token = await convexAuth.getToken();
  const user = await fetchQuery(api.users.currentUser, {}, { token });

  // Sin perfil todavía (p. ej. justo tras crear la cuenta): que entre al
  // login en vez de quedarse en una ruta a medio proteger.
  if (user === null) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  const esTutor =
    user.roles?.includes("tutor") || user.roles?.includes("administrador");
  const destinoPropio = esTutor ? "/panel" : "/hoy";
  const enRutaPropia = esTutor ? isPanelRoute(request) : isHoyRoute(request);

  if (!enRutaPropia) {
    return nextjsMiddlewareRedirect(request, destinoPropio);
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
