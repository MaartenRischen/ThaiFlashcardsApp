import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate the input
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name } = result.data;
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
      },
    });
    
    // Don't return the password in the response
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(
      { message: "Profile updated successfully", user: userWithoutPassword },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 