'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import React, { useEffect } from 'react';

import logger from '@/lib/logger';

import { isProd } from '@/constant/env';

export default function AuthForm() {
  const supabase = createClientComponentClient();
  const [hydrated, setHydrated] = React.useState(false);

  // on user Login redirect to dashboard
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      logger(event, 'event');
      // Never log auth sessions or access tokens.

      if (event === 'SIGNED_IN') {
        window.location.href = '/api/oauth/resume';
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  logger(isProd, 'isProd');

  logger(window.location.origin);

  return (
    <Auth
      supabaseClient={supabase}
      view='sign_in'
      appearance={{ theme: ThemeSupa }}
      theme='default'
      showLinks={true}
      socialLayout='horizontal'
      providers={['google']}
      redirectTo={window.location.origin + '/auth/callback'}
    />
  );
}
