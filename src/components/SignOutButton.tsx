"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      className="rounded-xl bg-gray-900 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-700"
    >
      Sign out
    </button>
  );
}
