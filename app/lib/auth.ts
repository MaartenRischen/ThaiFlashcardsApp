import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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
          // Test database connection first with a simple query
          try {
            await prisma.$queryRaw`SELECT 1`;
            console.log("Database connection test successful");
          } catch (error: any) {
            console.error("Database connection test failed:", {
              message: error?.message,
              code: error?.code,
              clientVersion: error?.clientVersion,
              meta: error?.meta
            });
            throw error; // Re-throw to be caught by the outer try/catch
          }
          
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
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
        } catch (error: any) {
          console.error("Error in authorize:", error);
          // Enhanced error logging with details
          if (error?.name === 'PrismaClientInitializationError' || 
              error?.name === 'PrismaClientKnownRequestError') {
            console.error("Database connection error details:", {
              message: error?.message,
              code: error?.code,
              clientVersion: error?.clientVersion,
              meta: error?.meta
            });
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.id) {
        // Assign the id from token to session.user
        session.user.id = token.id;
        
        // Keep the name and email if they exist
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && typeof user.id === 'string') {
        // Ensure user.id is copied to token
        token.id = user.id;
      }
      return token;
    },
  },
}); 