import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "convex/_generated/api";
import SignOutButton from "@/components/SignOutButton";

export default async function HomePage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/login");
  }

  const user = await fetchQuery(api.users.currentUser, {}, { token });
  if (user === null) {
    redirect("/login");
  }
  if (user.roles?.includes("estudiante")) {
    redirect("/hoy");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re signed in</h1>
        <p className="mt-2 text-gray-500">{user.email}</p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
