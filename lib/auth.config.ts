import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

const getApiUrl = () =>
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  pages: {
    signIn: "/connexion",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      if (trigger === "update" && session) {
        const s = session as { apiToken?: string; apiUser?: unknown };
        if (s.apiToken) (token as any).apiToken = s.apiToken;
        if (s.apiUser) (token as any).apiUser = s.apiUser;
        return token;
      }

      if (account) {
        (token as any).oauthProvider = account.provider;
      }

      if (account?.provider === "google" && account.id_token) {
        const apiUrl = getApiUrl();
        const resp = await fetch(`${apiUrl}/api/auth/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "google",
            idToken: account.id_token,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          (token as any).apiToken = data.token;
          (token as any).apiUser = data.user;
        }
      }

      if (account?.provider === "facebook" && account.access_token) {
        const apiUrl = getApiUrl();
        const resp = await fetch(`${apiUrl}/api/auth/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "facebook",
            accessToken: account.access_token,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          (token as any).apiToken = data.token;
          (token as any).apiUser = data.user;
        }
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = (token as any).apiToken;
      (session as any).apiUser = (token as any).apiUser;
      (session as any).oauthProvider = (token as any).oauthProvider;
      return session;
    },
  },
};
