"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/hoy", label: "Hoy", icon: "sun" },
  { href: "/estudiante/semana", label: "Mi semana", icon: "calendar" },
  {
    href: "/estudiante/animo",
    label: "Mi estado de ánimo",
    icon: "smile",
  },
  { href: "/estudiante/colores", label: "Mis colores", icon: "palette" },
] as const;

type IconName = (typeof navigation)[number]["icon"] | "calendarCheck";

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {name === "sun" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect height="17" rx="2.5" width="18" x="3" y="5" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </>
      )}
      {name === "smile" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
        </>
      )}
      {name === "palette" && (
        <>
          <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z" />
          <path d="M7.5 11h.01M10 7.5h.01M14 7.5h.01M17 10h.01" />
        </>
      )}
      {name === "calendarCheck" && (
        <>
          <rect height="17" rx="2.5" width="18" x="3" y="5" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14l2.5 2.5L16 11" />
        </>
      )}
    </svg>
  );
}

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[198px] shrink-0 flex-col bg-alumno-lateral px-3 py-5">
      <Link
        aria-label="GuiaMe, ir a Hoy"
        className="mb-7 flex min-h-12 items-center justify-center gap-3 px-2"
        href="/hoy"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-alumno-primario text-white">
          <Icon name="calendarCheck" />
        </span>
        <span className="text-2xl font-bold tracking-tight text-alumno-primario">
          GuiaMe
        </span>
      </Link>

      <nav aria-label="Navegación del estudiante">
        <ul className="flex flex-col gap-2">
          {navigation.map(({ href, label, icon }) => {
            const active =
              pathname === href ||
              (href === "/hoy" &&
                pathname.startsWith("/estudiante/actividad/"));

            return (
              <li key={href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border-l-4 px-2 py-3 text-center text-base font-bold leading-tight transition-colors ${
                    active
                      ? "border-alumno-acento bg-alumno-primario text-white"
                      : "border-transparent text-alumno-texto-secundario hover:bg-alumno-superficie-hecha"
                  }`}
                  href={href}
                >
                  <span className="[&>svg]:h-8 [&>svg]:w-8">
                    <Icon name={icon} />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex min-h-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-alumno-borde px-3 text-center text-sm text-alumno-texto-apagado">
        Logo del centro
      </div>
    </aside>
  );
}
