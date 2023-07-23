'use client';
import { useContext, useEffect, useState } from 'react';

import logger from '@/lib/logger';

import SignInButton from '@/components/buttons/SignInButton';
import SignOutButton from '@/components/buttons/SignOutButton';
import { AuthContext } from '@/components/context/AuthContext';
import Heading from '@/components/text/Heading';

export default function SignIn() {
  const authContext = useContext(AuthContext);

  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => {
    logger('Sign In Page');
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <></>;
  }

  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='flex flex-col items-center justify-center'>
        {authContext.user ? (
          <>
            <Heading className='text-center'>
              Welcome {authContext.user.displayName}
            </Heading>
            <SignOutButton />
          </>
        ) : (
          <>
            <Heading className='text-center'>Sign In to access</Heading>
            <SignInButton type='google' />
          </>
        )}
      </div>
    </div>
  );
}
