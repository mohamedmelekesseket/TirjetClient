import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

const getApiUrl = () => process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const handler = NextAuth({
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
    async jwt({ token, account }) {
      // After OAuth login, exchange provider token for our API JWT (Mongo-backed user)
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
          token.apiToken = data.token;
          token.apiUser = data.user;
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
          token.apiToken = data.token;
          token.apiUser = data.user;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose API JWT + Mongo user to the client
      (session as any).apiToken = (token as any).apiToken;
      (session as any).apiUser = (token as any).apiUser;
      return session;
    },
  },
});

export { handler as GET, handler as POST };