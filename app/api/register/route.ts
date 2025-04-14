import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { Prisma } from "@prisma/client";

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  let supabaseAuthUserId: string | null = null;
  let userEmail: string | null = null;

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
    userEmail = email;
    
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
        console.error(`Supabase Auth user creation failed for ${email}:`, authError);
        if (authError.message?.includes('already registered') || authError.message?.includes('email_exists')) {
             return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        } else {
             throw new Error(`Supabase Auth error: ${authError.message}`);
        }
    }

    if (!authData?.user?.id) {
        console.error(`Supabase Auth user created for ${email} but no user ID returned.`);
        throw new Error("Supabase Auth user created but no user data returned.");
    }
    supabaseAuthUserId = authData.user.id;
    console.log(`Successfully created Supabase Auth user for ${email} with ID: ${supabaseAuthUserId}`);

    // --- Step 2: Create user in Prisma Database ---
    console.log(`Attempting to create Prisma user for ${email}, linking Supabase ID: ${supabaseAuthUserId}`);
    const user = await prisma.user.create({
      data: {
        supabaseAuthUserId: supabaseAuthUserId,
        name,
        email,
      },
      select: { id: true, name: true, email: true, supabaseAuthUserId: true }
    });
    console.log(`Successfully created Prisma user ${user.id} linked to Supabase Auth: ${user.supabaseAuthUserId}`);
    
    console.log(`Successfully created Prisma user ${user.id} linked to Supabase Auth: ${user.supabaseAuthUserId}`);
    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: user
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error(`Error during registration process for email: ${userEmail ?? 'unknown'}. Supabase User Created: ${!!supabaseAuthUserId}`, error);
    
    if (supabaseAuthUserId) {
        console.warn(`Prisma operation failed after Supabase user ${supabaseAuthUserId} was created. Attempting rollback.`);
        try {
            const supabaseAdmin = getSupabaseAdmin();
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUserId);
            if (deleteError) {
                console.error(`CRITICAL: Failed to clean up orphaned Supabase Auth user ${supabaseAuthUserId}:`, deleteError);
            } else {
                console.log(`Successfully rolled back (deleted) Supabase Auth user ${supabaseAuthUserId}.`);
            }
        } catch (cleanupError) {
             console.error(`Error during Supabase Auth user ${supabaseAuthUserId} cleanup:`, cleanupError);
        }
    }
    
    let status = 500;
    let message = "Something went wrong during registration.";
    let details = error.message;

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        status = 409;
        message = "User registration conflict.";
        details = `A user with the provided details (likely email: ${userEmail}) already exists or conflicts with existing data.`;
        console.error(`Prisma unique constraint violation (P2002) for email: ${userEmail}. Rollback attempted.`);
    } else if (error.message?.startsWith('Supabase Auth error:')) {
         message = "An internal error occurred during authentication setup.";
    } else {
        message = "Failed to save user details to database.";
        details = `Error during Prisma operation: ${error.message}`;
        console.error(`Registration failed during Prisma operation for email: ${userEmail}`);
    }

    return NextResponse.json(
      { error: message, details: details },
      { status: status }
    );
  }
} 