'use client';
import { useEffect, useState } from 'react';

import AuthForm from '@/components/AuthForm';

export default function SignIn() {
  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <></>;
  }

  return (
    <div className='flex h-screen items-center justify-center'>
      <AuthForm />
    </div>
  );
}
