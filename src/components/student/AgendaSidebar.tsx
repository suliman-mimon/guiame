"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Sun, Calendar, Smile, Palette } from "lucide-react";

const NAV_ITEMS = [
  { href: "/estudiante/hoy", label: "Hoy", icon: Sun },
  { href: "/estudiante/semana", label: "Mi semana", icon: Calendar },
  { href: "/estudiante/animo", label: "Mi estado de ánimo", icon: Smile },
  { href: "/estudiante/colores", label: "Mis colores", icon: Palette },
];

export default function AgendaSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex min-h-screen w-48 shrink-0 flex-col gap-2 border-r border-black/5 bg-guiame-cream p-4">
      <div className="mb-4 flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-guiame-teal">
          <CalendarCheck className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-guiame-teal">GuiaMe</span>
      </div>

      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-center text-sm font-semibold transition ${
              active
                ? "bg-guiame-teal text-white"
                : "text-gray-700 hover:bg-black/5"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}

      <div className="mt-auto rounded-2xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
        Logo del centro
      </div>
    </nav>
  );
}
