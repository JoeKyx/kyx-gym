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
  logger(
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL_PROD,
    'process.env.NEXT_PUBLIC_DEPLOYMENT_URL_PROD'
  );
  logger(
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL_DEV,
    'process.env.NEXT_PUBLIC_DEPLOYMENT_URL_DEV'
  );

  return (
    <Auth
      supabaseClient={supabase}
      view='sign_in'
      appearance={{ theme: ThemeSupa }}
      theme='default'
      showLinks={true}
      socialLayout='horizontal'
      providers={['google']}
      redirectTo={
        isProd
          ? process.env.NEXT_PUBLIC_DEPLOYMENT_URL_PROD + '/auth/callback'
          : process.env.NEXT_PUBLIC_DEPLOYMENT_URL_DEV + '/auth/callback'
      }
    />
  );
}
