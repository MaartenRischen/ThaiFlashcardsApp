import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

// Create a resilient Prisma client that doesn't block startup
let prismaClient: PrismaClient | null = null;

try {
  prismaClient = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }
} catch (error) {
  console.warn("Failed to initialize Prisma client:", error);
  // Create a mock client that will fail gracefully
  prismaClient = null;
}

export const prisma = prismaClient as PrismaClient; 