'use client';
import { getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { auth, provider } from '@/lib/firebase-config';
import logger from '@/lib/logger';

import Button from '@/components/buttons/Button';
import Heading from '@/components/text/Heading';

export default function SignIn() {
  const [hydrated, setHydrated] = useState<boolean>(false);
  const router = useRouter();
  useEffect(() => {
    logger('Sign In Page');
    setHydrated(true);

    getRedirectResult(auth).then(async (userCred) => {
      logger(userCred, 'Redirect Result');
      if (!userCred) {
        logger(userCred, 'No user cred');
        return;
      }

      fetch('/api/login', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await userCred.user.getIdToken()}`,
        },
      }).then((response) => {
        logger(response, 'POST /api/login');
        if (response.status === 200) {
          router.push('/dashboard');
        }
      });
    });
  }, [router]);

  if (!hydrated) {
    return <></>;
  }

  function signIn() {
    logger('Sign In');
    signInWithRedirect(auth, provider);
  }

  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='flex flex-col items-center justify-center'>
        <Heading className='text-center'>Sign In to access</Heading>
        <Button onClick={signIn}>Sign In with Google</Button>
      </div>
    </div>
  );
}
