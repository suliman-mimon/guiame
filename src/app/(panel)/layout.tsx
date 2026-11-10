import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "convex/_generated/api";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/panel/login");
  }

  const user = await fetchQuery(api.users.currentUser, {}, { token });
  if (user === null || user.role === "student") {
    redirect("/panel/login");
  }

  return <>{children}</>;
}
