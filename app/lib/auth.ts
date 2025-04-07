import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

// Ensure we have a secret
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.warn("Warning: NEXTAUTH_SECRET not set. This is required for JWT encryption.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",  // Changed back to "jwt" - required for Credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: secret,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {  // Changed back to token parameter instead of user
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
      }
      return session;
    },
    async jwt({ token, user }) {  // Re-enabled the JWT callback
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
}); 