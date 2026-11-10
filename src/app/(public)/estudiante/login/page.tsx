"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { CalendarCheck, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function StudentLoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/estudiante/hoy");
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-guiame-cream px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-guiame-teal">
            <CalendarCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-guiame-teal">GuiaMe</h1>
          <p className="mt-1 text-gray-500">Mi agenda del cole</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
              <User className="h-5 w-5" />
              Usuario
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Escribe tu usuario"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:border-guiame-teal"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
              <Lock className="h-5 w-5" />
              Contraseña
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe tu contraseña"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:border-guiame-teal"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((v) => !v)}
                className="flex w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-guiame-teal py-4 text-lg font-semibold text-white transition hover:bg-guiame-teal-dark disabled:opacity-60"
          >
            <ArrowRight className="h-5 w-5" />
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No puedes entrar? Pide ayuda a tu tutor o tutora.
        </p>
      </div>
    </main>
  );
}
