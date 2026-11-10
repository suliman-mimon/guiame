import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "convex/_generated/api";

export default async function MisEstudiantesPage() {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.currentUser, {}, { token });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Mis estudiantes</h1>
      <p className="mt-2 text-gray-500">
        Hola, {user?.displayName ?? "..."}. Esta pantalla se construirá en el
        siguiente paso (M5/M6).
      </p>
    </main>
  );
}
