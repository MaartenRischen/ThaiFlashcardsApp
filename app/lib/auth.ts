import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@supabase/supabase-js";

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
        // Ensure Supabase credentials are set before proceeding
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Cannot authorize: Supabase URL or Anon Key missing from environment variables.");
          return null;
        }
        if (!credentials?.email || !credentials?.password) {
          console.error("Authorize attempt with missing email or password.");
          return null;
        }

        // Create a temporary Supabase client for auth check
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }, // Don't persist session server-side for this check
        });

        try {
          console.log(`Attempting Supabase sign-in for: ${credentials.email}`);
          // Attempt to sign in with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error) {
            console.error(`Supabase sign-in error for ${credentials.email}:`, error.message);
            return null; // Indicates invalid credentials or other Supabase error
          }

          if (data?.user) {
            console.log(`Supabase sign-in successful for ${credentials.email}, user ID: ${data.user.id}`);
            // Return the essential info needed by next-auth session/token callbacks
            return {
              id: data.user.id, // Use the Supabase user ID
              email: data.user.email,
              // name: data.user.user_metadata?.name, // Optional
              // image: data.user.user_metadata?.avatar_url, // Optional
            };
          } else {
            console.error(`Supabase sign-in for ${credentials.email} reported success but returned no user data.`);
            return null;
          }

        } catch (error: any) {
          console.error(`Unexpected error during Supabase authorize for ${credentials.email}:`, error);
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