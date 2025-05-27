import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function verifyAuth(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return {
        authenticated: false,
        error: 'Unauthorized',
        status: 401
      };
    }

    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return {
        authenticated: false,
        error: 'Forbidden: Admin access required',
        status: 403
      };
    }

    return {
      authenticated: true,
      user: session.user
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
      status: 401
    };
  }
}
