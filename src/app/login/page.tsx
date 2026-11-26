"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/");
    } catch {
      setError("Usuario o contraseña incorrectos, o la cuenta está desactivada.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf1ef] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-[#fffefb] p-8 shadow-xl shadow-[#5f6f6b]/10 sm:p-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d7a7a] text-white"
          >
            <svg
              fill="none"
              height="25"
              viewBox="0 0 24 24"
              width="25"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3.75a8.25 8.25 0 1 0 8.25 8.25A8.25 8.25 0 0 0 12 3.75Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 7.5v4.75l3.25 1.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#2d7a7a]">
            GuiaMe
          </span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#272a28]">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#65706d]">
            Accede a tu espacio de GuiaMe con tu usuario y contraseña.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#272a28]"
              htmlFor="username"
            >
              Usuario
            </label>
            <input
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-12 w-full rounded-xl border border-[#abb5b1] bg-white px-4 text-[#272a28] outline-none transition placeholder:text-[#8b948f] focus:border-[#2d7a7a] focus:ring-4 focus:ring-[#d9e7e4]"
              id="username"
              name="username"
              required
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu usuario o email"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#272a28]"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-[#abb5b1] bg-white px-4 text-[#272a28] outline-none transition placeholder:text-[#8b948f] focus:border-[#2d7a7a] focus:ring-4 focus:ring-[#d9e7e4]"
              id="password"
              name="password"
              placeholder="Tu contraseña"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="h-12 w-full rounded-xl bg-[#2d7a7a] font-semibold text-white transition hover:bg-[#236464] focus:outline-none focus:ring-4 focus:ring-[#bcd5d1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Accediendo..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs leading-5 text-[#65706d]">
          Si no puedes acceder, contacta con tu tutor o administrador.
        </p>
      </div>
    </main>
  );
}
