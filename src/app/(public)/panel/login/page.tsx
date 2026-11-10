"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { CalendarCheck, Lock, AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const MAX_ATTEMPTS = 3;

export default function PanelLoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = MAX_ATTEMPTS - failedAttempts;
  const isLocked = remaining <= 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setIsSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/panel/estudiantes");
    } catch {
      setFailedAttempts((n) => n + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <section className="flex flex-col justify-center gap-6 bg-guiame-panel-blue px-8 py-16 text-white md:w-1/2 md:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
            <CalendarCheck className="h-6 w-6 text-guiame-panel-blue" />
          </div>
          <span className="text-2xl font-bold">GuiaMe</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight">
          La agenda del aula, clara para cada estudiante.
        </h1>
        <p className="text-lg text-blue-100">
          Crea actividades con pictogramas, asígnalas a tus estudiantes y
          sigue cómo avanzan durante el día.
        </p>
        <p className="mt-auto text-sm text-blue-200">
          Acceso solo para profesionales y tutores autorizados.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-gray-50 px-8 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-1 text-gray-500">Panel del profesional</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {failedAttempts > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {isLocked
                    ? "Demasiados intentos fallidos. La cuenta se ha bloqueado durante un tiempo."
                    : `El correo o la contraseña no son correctos. Te quedan ${remaining} intentos. Después la cuenta se bloqueará durante un tiempo.`}
                </span>
              </div>
            )}

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                disabled={isLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@centro.es"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-guiame-panel-blue disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                Contraseña
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-guiame-panel-blue disabled:bg-gray-100"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-guiame-panel-blue py-3 font-semibold text-white transition hover:bg-guiame-panel-blue-dark disabled:opacity-60"
            >
              <ArrowRight className="h-5 w-5" />
              Entrar al panel
            </button>
          </form>

          <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            La sesión se cierra sola tras 30 minutos sin uso.
          </p>
        </div>
      </section>
    </main>
  );
}
