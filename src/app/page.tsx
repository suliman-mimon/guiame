import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "convex/_generated/api";

export default async function HomePage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/panel/login");
  }

  const user = await fetchQuery(api.users.currentUser, {}, { token });
  if (user === null) {
    redirect("/panel/login");
  }

  if (user.role === "student") {
    redirect("/estudiante/hoy");
  }

  redirect("/panel/estudiantes");
}
