import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const token = authService.extractTokenFromHeaders(request.headers);
    
    if (token) {
      await authService.logout(token);
    }

    // Clear cookie
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}