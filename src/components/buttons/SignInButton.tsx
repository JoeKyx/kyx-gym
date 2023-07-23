import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  TwitterAuthProvider,
} from 'firebase/auth';
import { FC } from 'react';

import { auth } from '@/lib/firebase-config';

import Button from '@/components/buttons/Button';

interface SignInButtonProps {
  type: 'google' | 'facebook' | 'twitter';
}

const SignInButton: FC<SignInButtonProps> = ({ type }) => {
  async function signIn() {
    let provider = null;
    switch (type) {
      case 'google':
        provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        break;
      case 'facebook':
        provider = new FacebookAuthProvider();
        break;
      case 'twitter':
        provider = new TwitterAuthProvider();
        break;
    }
    await signInWithPopup(auth, provider);
  }

  return <Button onClick={signIn}>Sign In with {type}</Button>;
};

export default SignInButton;
