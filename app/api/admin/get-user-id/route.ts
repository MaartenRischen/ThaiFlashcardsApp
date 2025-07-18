import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      userId,
      email: user.emailAddresses?.[0]?.emailAddress,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 