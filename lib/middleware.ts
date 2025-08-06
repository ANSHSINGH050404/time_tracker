import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.cookies.get('auth-token')?.value;

  if (!token) return null;

  return verifyToken(token);
}

export function requireAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(request, user);
  };
}

export function requireAdmin(handler: (req: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthUser(request);
    
    if (!user || user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(request, user);
  };
}