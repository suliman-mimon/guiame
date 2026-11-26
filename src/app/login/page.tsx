"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// GM-27 · Login único (Figma, pantalla 1): el mismo para alumnado y
// profesionales; al entrar, src/proxy.ts lleva a cada uno a lo suyo (/hoy o
// /panel). Colores de la paleta «crema» del alumno (tokens --alumno-*), con
// los campos y el texto de ejemplo por encima del contraste mínimo (RNF1).

function IconoPersona() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="10" rx="2" width="16" x="4" y="11" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEntrando(true);
    try {
      await signIn("password", { email: usuario.trim(), password: contrasena, flow: "signIn" });
      router.push("/");
    } catch {
      setError("El usuario o la contraseña no son correctos. Revísalos y vuelve a probar.");
    } finally {
      setEntrando(false);
    }
  }

  const campo =
    "h-14 w-full rounded-xl border-2 border-alumno-borde-campo bg-alumno-superficie px-4 text-lg text-alumno-texto outline-none transition placeholder:text-alumno-texto-suave focus:border-alumno-primario focus:ring-4 focus:ring-alumno-primario/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-alumno-fondo px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-alumno-superficie p-8 shadow-xl shadow-alumno-texto/10 sm:p-10">
        <header className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-alumno-primario text-alumno-sobre-primario"
          >
            <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="17" rx="2" width="18" x="3" y="4" />
              <path d="M3 9h18M8 2v4M16 2v4" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-alumno-texto">GuiaMe</h1>
          <p className="mt-1 text-lg text-alumno-texto-secundario">Mi agenda del cole</p>
        </header>

        <form className="mt-8 space-y-5" onSubmit={entrar} noValidate>
          {error && (
            <p
              className="rounded-xl border-2 border-alerta bg-alerta-suave px-4 py-3 font-semibold text-alerta"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 font-bold text-alumno-texto" htmlFor="usuario">
              <IconoPersona />
              Usuario
            </label>
            <input
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              className={campo}
              id="usuario"
              name="usuario"
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Escribe tu usuario"
              required
              spellCheck={false}
              type="text"
              value={usuario}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 font-bold text-alumno-texto" htmlFor="contrasena">
              <IconoCandado />
              Contraseña
            </label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className={`${campo} pr-16`}
                id="contrasena"
                name="contrasena"
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Escribe tu contraseña"
                required
                type={verContrasena ? "text" : "password"}
                value={contrasena}
              />
              <button
                aria-label={verContrasena ? "Ocultar la contraseña" : "Ver la contraseña"}
                aria-pressed={verContrasena}
                className="absolute inset-y-0 right-1 my-1 flex w-12 items-center justify-center rounded-lg text-alumno-texto-secundario hover:bg-alumno-fondo focus:outline-none focus:ring-4 focus:ring-alumno-primario/20"
                onClick={() => setVerContrasena((v) => !v)}
                type="button"
              >
                <IconoOjo tachado={verContrasena} />
              </button>
            </div>
          </div>

          <button
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-alumno-primario text-lg font-bold text-alumno-sobre-primario transition hover:bg-alumno-primario-hover focus:outline-none focus:ring-4 focus:ring-alumno-primario/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={entrando || !usuario.trim() || !contrasena}
            type="submit"
          >
            {entrando ? "Entrando…" : "Entrar"}
            {!entrando && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="mt-8 text-center text-alumno-texto-secundario">
          ¿No puedes entrar? Pide ayuda a tu tutor o tutora.
        </p>
      </div>
    </main>
  );
}
