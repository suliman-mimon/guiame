"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "convex/_generated/api";
import {
  IconoAgenda,
  IconoEstudiantes,
  IconoMas,
  IconoSalir,
} from "./Iconos";

// Marco común del panel del profesional (Figma W2–W5): barra lateral con la
// marca, la navegación, la persona que ha entrado y «Cerrar sesión».
// En pantallas estrechas la barra pasa arriba.

const enlaces = [
  { href: "/panel", texto: "Mis estudiantes", Icono: IconoEstudiantes },
  { href: "/panel/actividades/nueva", texto: "Nueva actividad", Icono: IconoMas },
];

function estaActivo(pathname: string, href: string) {
  if (href === "/panel") {
    return pathname === "/panel" || pathname.startsWith("/panel/estudiantes");
  }
  return pathname.startsWith(href);
}

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const usuario = useQuery(api.users.currentUser, {});
  const clases = useQuery(api.panel.misClases, {});
  const clase =
    clases && clases.length > 0
      ? new Intl.ListFormat("es", { type: "conjunction" }).format(clases)
      : "";

  const nombre = usuario
    ? [usuario.name, usuario.apellidos].filter(Boolean).join(" ") || usuario.email || ""
    : "";
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  async function cerrarSesion() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-panel-fondo md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-panel-borde bg-panel-lateral px-4 py-4 md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0 md:py-6">
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-boton bg-panel-primario text-white">
            <IconoAgenda className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-texto">GuiaMe</p>
            <p className="text-sm text-texto-suave">Panel del profesional</p>
          </div>
        </div>

        <nav aria-label="Panel del profesional">
          <ul className="flex gap-1 md:flex-col">
            {enlaces.map(({ href, texto, Icono }) => {
              const activo = estaActivo(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-boton px-3 font-medium transition-colors ${
                      activo
                        ? "bg-panel-primario-suave text-panel-primario"
                        : "text-texto hover:bg-panel-fondo"
                    }`}
                  >
                    <Icono className="h-5 w-5" />
                    {texto}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-2 md:mt-auto md:flex-col md:items-stretch">
          <div className="flex items-center gap-3 px-2">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-fondo text-sm font-semibold text-texto"
            >
              {iniciales}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-semibold text-texto">{nombre || " "}</p>
              <p className="text-sm text-texto-suave">Tutor{clase ? ` · ${clase}` : ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex min-h-11 items-center gap-3 rounded-boton px-3 font-medium text-texto transition-colors hover:bg-panel-fondo"
          >
            <IconoSalir className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
