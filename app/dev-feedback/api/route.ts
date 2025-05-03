// Remove unused: import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const PASSWORD_COOKIE = 'dev_feedback_pw';

// Handle password POST
export async function POST(req: Request) {
  const data = await req.formData();
  const pw = data.get('pw');
  const correctPw = process.env.DEV_FEEDBACK_PASSWORD;

  if (pw && correctPw && pw === correctPw) {
    // Set cookie for 1 day
    const response = NextResponse.redirect(new URL('/dev-feedback', req.url), { status: 302 });
    response.cookies.set(PASSWORD_COOKIE, correctPw, {
      path: '/',
      maxAge: 86400, // 1 day in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return response;
  }

  // Wrong password, redirect back
  return NextResponse.redirect(new URL('/dev-feedback', req.url), { status: 302 });
} 