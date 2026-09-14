import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  await supabase.auth.getSession();
  return res;
}

// These routes perform their own user/token verification. Machine clients must
// not depend on Supabase browser-session refresh in Edge Middleware.
export const config = {
  matcher: [
    '/((?!api/mcp|api/agent|api/oauth|\\.well-known|_next/static|_next/image|favicon.ico).*)',
  ],
};
