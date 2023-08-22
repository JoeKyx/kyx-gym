'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import React from 'react';

export default function AuthForm() {
  const supabase = createClientComponentClient();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <Auth
      supabaseClient={supabase}
      view='sign_in'
      appearance={{ theme: ThemeMinimal }}
      theme='default'
      showLinks={true}
      socialLayout='horizontal'
      providers={['google']}
      redirectTo='http://localhost:3000/auth/callback'
    />
  );
}
