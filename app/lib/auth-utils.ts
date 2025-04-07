import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export async function requireAuth(req: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return {
      auth: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
      userId: null
    };
  }
  
  return {
    auth: true,
    response: null,
    userId: session.user.id,
    user: session.user
  };
} 