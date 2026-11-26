import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "convex/_generated/api";
import TemaProvider from "@/components/TemaProvider";
import StudentSidebar from "@/components/estudiante/StudentSidebar";

export default async function HoyLayout({
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

  // TemaProvider (GM-35): paleta, tamaño de letra y formatos que el tutor
  // elige en Ajustes (HU-07); cambian en la tablet sin recargar.
  return (
    <TemaProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-alumno-fondo">
        <StudentSidebar />
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </TemaProvider>
  );
}
