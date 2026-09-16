import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { syncCookies } from '@/lib/supabase-cookie-adapter';

import type { Database } from '@/types/supabase';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  logger('Calling /api/auth/callback', 'debug');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({
      cookies: syncCookies(cookieStore),
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes

  return NextResponse.redirect(new URL('/api/oauth/resume', request.url));
}
