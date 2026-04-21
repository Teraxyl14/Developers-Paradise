import type { NextAuthConfig } from "next-auth"

// Notice this is completely Edge-compatible (no Node.js specific libraries like bcrypt or Prisma)
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [], // Keep empty here; populate in auth.ts to avoid bundling heavy libs
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
