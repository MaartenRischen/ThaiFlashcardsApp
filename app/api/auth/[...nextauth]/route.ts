import { handlers } from "@/app/lib/auth";

export const { GET, POST } = handlers;

// Force dynamic rendering for auth route to avoid caching issues
export const dynamic = "force-dynamic"; 