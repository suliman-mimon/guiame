import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "convex/_generated/api";

export default async function ActivityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const token = await convexAuthNextjsToken();

  if (!token) {
    redirect("/login");
  }

  if (token) {
    const user = await fetchQuery(api.users.currentUser, {}, { token });
    if (!user?.roles?.includes("estudiante")) {
      redirect("/login");
    }
  }

  return children;
}
