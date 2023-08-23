'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import AuthForm from '@/components/AuthForm';

import { isProd } from '@/constant/env';
export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [_loading, setLoading] = useState(true);

  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadeddata = () => {
        setLoading(false);
      };
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated)
    return (
      <div className='flex h-screen w-screen flex-col items-center justify-center'>
        <Loader2 className='animate-spin' size={200} />
      </div>
    );

  return (
    <div className='relative h-screen w-screen overflow-hidden'>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        src='/videos/bg_vid.mp4'
        className='absolute inset-0 z-0 h-full w-full object-cover'
      />
      <div className='absolute inset-0 z-10 bg-black opacity-80'></div>

      <main className='relative z-20 mx-5 flex flex-col items-center'>
        {!isProd && (
          <span className='text-white'>
            Are we prod? {isProd ? 'Yes' : 'No'}
          </span>
        )}
        <Image
          src='/images/kgLogo.png'
          height={300}
          width={300}
          alt='Kyx Gym Logo'
        />
        <div className='md:mx-auto md:w-1/2 md:items-center md:justify-center'>
          <AuthForm />
        </div>
      </main>
    </div>
  );
}
