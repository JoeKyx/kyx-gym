'use client';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { features } from '@/lib/data';

import ButtonLink from '@/components/links/ButtonLink';
export default function Intro() {
  const item = {
    initial: { opacity: 0 },
    animate: (index: number) => ({
      opacity: 1,
      transition: {
        delay: 1.4 + index * 0.4,
        duration: 0.7,
      },
    }),
  };

  return (
    <div className='flex h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-slate-200 pt-10'>
      <motion.div
        className='flex flex-col items-center'
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', delay: 0.1, duration: 0.7 }}
      >
        <Image
          src='/images/kgLogo.png'
          width={250}
          height={250}
          alt='logo of Kyx Gym'
        />
        <h1 className='font-poppins text-center text-4xl font-bold'>
          Focus on your Workout
        </h1>
        <h1 className='font-poppins text-center text-5xl font-bold'>
          Let <span className='text-primary-500'>Kyx</span> do the rest
        </h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', delay: 0.7, duration: 1.7 }}
      >
        <div className='flex flex-col items-center p-10'>
          <p className='text-center text-xl font-semibold'>
            Keep track of your workouts. See your progress. Gain rewards. Become
            a better you.
          </p>
          <p className='text-center text-lg'>
            Completley free. No premium features. No bullshit.
          </p>
        </div>
        <div className='flex justify-between gap-20'>
          <ButtonLink href='#workout' variant='ghost'>
            Learn More
          </ButtonLink>
          <ButtonLink href='/dashboard' rightIcon={LogIn}>
            Get Started
          </ButtonLink>
        </div>
      </motion.div>
      <div className='mt-10 h-48 w-full grid-cols-3 px-6 md:grid  md:gap-20 '>
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className='relative mb-4 h-full w-full overflow-hidden rounded-lg border border-black/60 drop-shadow-lg transition-all duration-300 ease-in-out hover:scale-105 md:mb-0'
            variants={item}
            custom={index}
            initial='initial'
            animate='animate'
          >
            <Link href={feature.href}>
              <Image
                src={feature.image}
                alt={feature.name}
                quality={95}
                className='h-full object-cover'
              />

              <h2 className='font-poppins absolute bottom-0 right-2 text-left text-2xl font-bold text-white'>
                {feature.name}
              </h2>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
