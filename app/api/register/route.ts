import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  let supabaseAuthUserId: string | null = null;
  try {
    const body = await req.json();
    
    // Validate the input
    const result = userSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // --- Step 1: Create user in Supabase Auth --- 
    console.log(`Attempting to create user in Supabase Auth for email: ${email}`);
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: name },
    });

    if (authError) {
        console.error("Supabase Auth user creation failed:", authError);
        if (authError.message.includes('User already registered')) {
             return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        }
        throw new Error(`Supabase Auth error: ${authError.message}`);
    }

    if (!authData || !authData.user) {
        throw new Error("Supabase Auth user created but no user data returned.");
    }
    supabaseAuthUserId = authData.user.id;
    console.log(`Successfully created Supabase Auth user with ID: ${supabaseAuthUserId}`);

    // --- Step 2: Create user in Prisma Database (without password) --- 
    
    const existingPrismaUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingPrismaUser) {
       console.warn(`User ${email} already exists in Prisma DB but was just created in Supabase Auth (${supabaseAuthUserId}). Linking attempt or manual check needed.`);
       return NextResponse.json({ error: "User inconsistency - exists in Prisma but not expected."}, { status: 500 });
    }

    const user = await prisma.user.create({
      data: {
        id: undefined,
        supabaseAuthUserId: supabaseAuthUserId,
        name,
        email,
      },
      select: { id: true, name: true, email: true, supabaseAuthUserId: true }
    });
    
    console.log(`Successfully created Prisma user linked to Supabase Auth: ${user.id}`);
    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: user
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (supabaseAuthUserId) {
        console.warn(`Prisma user creation failed for ${supabaseAuthUserId}. Attempting to delete Supabase Auth user.`);
        try {
            const supabaseAdmin = getSupabaseAdmin();
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUserId);
            if (deleteError) {
                console.error("Failed to clean up orphaned Supabase Auth user:", deleteError);
            } else {
                console.log("Cleaned up orphaned Supabase Auth user.");
            }
        } catch (cleanupError) {
             console.error("Error during Supabase Auth user cleanup:", cleanupError);
        }
    }
    
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
} 