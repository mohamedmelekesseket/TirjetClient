import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth.config";

/**
 * When NextAuth JWT is missing apiToken (e.g. first OAuth exchange to Railway failed),
 * this route uses the signed-in session and a shared secret to obtain the same API JWT
 * from Railway. Client then calls session.update({ apiToken, apiUser }).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const apiUrl =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "INTERNAL_API_KEY manquant sur Vercel" },
      { status: 500 }
    );
  }

  const provider =
    ((session as { oauthProvider?: string }).oauthProvider as "google" | "facebook") ||
    "google";

  const res = await fetch(`${apiUrl}/api/auth/link-nextauth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
    body: JSON.stringify({
      email: session.user.email,
      name: session.user.name || session.user.email,
      image: session.user.image,
      provider,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: text || "Échec liaison backend" },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { token: string; user: unknown };
  return NextResponse.json({ token: data.token, user: data.user });
}
