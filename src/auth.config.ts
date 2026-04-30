import type { NextAuthConfig } from "next-auth"

// Notice this is completely Edge-compatible (no Node.js specific libraries like bcrypt or Prisma)
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [], // Keep empty here; populate in auth.ts to avoid bundling heavy libs
  callbacks: {
    async jwt({ token, user, account }) {
      // On every fresh sign-in (user + account present), overwrite the token
      if (user && account) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
