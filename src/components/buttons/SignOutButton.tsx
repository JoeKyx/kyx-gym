import { signOut } from 'firebase/auth';
import { FC } from 'react';

import { auth } from '@/lib/firebase-config';

import Button from '@/components/buttons/Button';

const SignOutButton: FC = () => {
  const signOutHandler = async () => {
    await signOut(auth);
  };

  return <Button onClick={signOutHandler}>Sign out</Button>;
};

export default SignOutButton;
