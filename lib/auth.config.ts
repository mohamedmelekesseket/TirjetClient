import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

const getApiUrl = () =>
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Vérifie si le token API est encore valide (ou expiré)
async function isApiTokenValid(apiToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Renouvelle le token via sync-token (même logique que ta route POST)
async function refreshApiToken(
  email: string,
  name: string,
  image: string | null,
  provider: string,
  idToken?: string,
  accessToken?: string
) {
  const internalKey = process.env.INTERNAL_API_KEY;

  // Try internal key method first
  if (internalKey) {
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/link-nextauth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
        },
        body: JSON.stringify({ email, name: name || email, image, provider }),
      });
      if (res.ok) {
        const data = await res.json();
        return data as { token: string; user: unknown };
      }
    } catch {
      // Fall through to OAuth method
    }
  }

  // Fallback: Use OAuth endpoint with stored tokens
  if (idToken || accessToken) {
    try {
      const oauthBody =
        provider === "google"
          ? { provider: "google", idToken }
          : { provider: "facebook", accessToken };

      const res = await fetch(`${getApiUrl()}/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oauthBody),
      });
      if (res.ok) {
        const data = await res.json();
        return data as { token: string; user: unknown };
      }
    } catch {
      // Return null if both methods fail
    }
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/connexion" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      // ── Mise à jour manuelle (session.update()) ──
      if (trigger === "update" && session) {
        const s = session as { apiToken?: string; apiUser?: unknown };
        if (s.apiToken) (token as any).apiToken = s.apiToken;
        if (s.apiUser)  (token as any).apiUser  = s.apiUser;
        return token;
      }

      // ── Premier login OAuth ──
      if (account) {
        (token as any).oauthProvider = account.provider;
        // Store OAuth tokens for later refresh
        (token as any).idToken = account.id_token;
        (token as any).accessToken = account.access_token;

        const oauthBody =
          account.provider === "google"
            ? { provider: "google",   idToken:      account.id_token }
            : { provider: "facebook", accessToken:  account.access_token };

        const resp = await fetch(`${getApiUrl()}/api/auth/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(oauthBody),
        });
        if (resp.ok) {
          const data = await resp.json();
          (token as any).apiToken = data.token;
          (token as any).apiUser  = data.user;
        }
        return token;
      }

      // ── Mise à jour manuelle (session.update()) ──
      if (trigger === "update" && session) {
        const s = session as { apiToken?: string; apiUser?: unknown };
        if (s.apiToken) (token as any).apiToken = s.apiToken;
        if (s.apiUser)  (token as any).apiUser  = s.apiUser;
        return token;
      }

      return token;
    },

    async session({ session, token }) {
      (session as any).apiToken      = (token as any).apiToken;
      (session as any).apiUser       = (token as any).apiUser;
      (session as any).oauthProvider = (token as any).oauthProvider;
      return session;
    },
  },
};