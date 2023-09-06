'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { useEffect, useRef } from 'react';

import AuthForm from '@/components/AuthForm';
import Button from '@/components/buttons/Button';
import Information from '@/components/home/Information';

import { isProd } from '@/constant/env';

export default function HomePage() {
  const infoRef = useRef<HTMLDivElement | null>(null); // ref for the information section
  const loginRef = useRef<HTMLDivElement | null>(null); // ref for the login section

  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated)
    return (
      <div className='flex h-screen w-screen flex-col items-center justify-center bg-black'>
        <Loader2 className='text-primary-500 animate-spin' size={200} />
      </div>
    );

  const handleLearnMoreClick = () => {
    infoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div
        className='relative z-20 h-screen w-full bg-black bg-opacity-60'
        style={{
          backgroundImage: `url('/images/bg/ancient_ninja_gym_2.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className='absolute inset-0 -z-10 bg-black bg-opacity-60'></div>

        <main className='flex h-full flex-col items-center' ref={loginRef}>
          {!isProd && (
            <span className='text-white'>
              Are we prod? {isProd ? 'Yes' : 'No'}
            </span>
          )}
          <Image
            src='/images/kgLogo.png'
            height={250}
            width={250}
            alt='Kyx Gym Logo'
          />
          <div className='md:mx-auto md:w-1/2 md:items-center md:justify-center'>
            <AuthForm />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-center text-white'>New to Kyx Gym? </span>
            <Button onClick={handleLearnMoreClick}>Learn more!</Button>
          </div>
        </main>
      </div>
      <div ref={infoRef}>
        <Information refToScroll={loginRef} />
      </div>
    </>
  );
}
