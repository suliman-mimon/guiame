import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isStudentRoute = createRouteMatcher(["/estudiante(.*)"]);
const isPanelRoute = createRouteMatcher(["/panel(.*)"]);
const isPublicRoute = createRouteMatcher(["/estudiante/login", "/panel/login"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (!isStudentRoute(request) && !isPanelRoute(request)) {
    return;
  }

  if (!(await convexAuth.isAuthenticated())) {
    const loginPath = isPanelRoute(request) ? "/panel/login" : "/estudiante/login";
    return nextjsMiddlewareRedirect(request, loginPath);
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
