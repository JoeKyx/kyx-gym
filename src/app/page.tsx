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
    <div className='overflow-x-hidden'>
      <div className='relative h-screen w-screen overflow-x-hidden bg-black'>
        <Image
          src='/images/bg/ancient_ninja_gym_2.jpeg'
          layout='fill'
          objectFit='cover'
          alt='Background Image'
          className='z-0 opacity-40'
        />

        <main
          className='relative z-20 mx-5 flex flex-col items-center'
          ref={loginRef}
        >
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
      <div ref={infoRef} className='h-screen'>
        <Information refToScroll={loginRef} />
      </div>
    </div>
  );
}
