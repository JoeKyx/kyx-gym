'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import React from 'react';

import logger from '@/lib/logger';

import { isProd } from '@/constant/env';

export default function AuthForm() {
  const supabase = createClientComponentClient();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  logger(isProd, 'isProd');

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
