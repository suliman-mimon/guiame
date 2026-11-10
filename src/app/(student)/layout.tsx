import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "convex/_generated/api";
import AgendaSidebar from "@/components/student/AgendaSidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/estudiante/login");
  }

  const user = await fetchQuery(api.users.currentUser, {}, { token });
  if (user === null || user.role !== "student") {
    redirect("/estudiante/login");
  }

  return (
    <div className="flex min-h-screen bg-guiame-cream">
      <AgendaSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
