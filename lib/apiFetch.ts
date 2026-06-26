import { signOut } from "next-auth/react";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);

  if (res.status === 401) {
    await signOut({ callbackUrl: "/connexion?expired=1" });
    throw new Error("Session expirée");
  }

  return res;
}