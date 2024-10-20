'use client';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import ButtonLink from '@/components/links/ButtonLink';

import ProfileScreenshot from '/public/images/screenshots/profile.png';

const fadeInAnimationVariants = {
  offscreen: {
    opacity: 0,
  },
  onscreen: (customDelay: number) => ({
    opacity: 1,
    transition: {
      delay: customDelay,
      duration: 1.7,
      type: 'spring',
    },
  }),
};

export default function GetStarted() {
  return (
    <section>
      <motion.div
        initial='offscreen'
        whileInView='onscreen'
        viewport={{ once: true, amount: 0.3 }}
        className='flex flex-col items-center justify-center gap-12 bg-gradient-to-b  from-slate-200 to-slate-100 pb-20 md:flex-row'
      >
        <div className='flex flex-col items-center'>
          <motion.h1
            className='font-poppins text-center text-5xl font-bold md:pt-0'
            variants={fadeInAnimationVariants}
            custom={0.2}
          >
            <span className='text-primary-500'>Kyx</span>Gym
          </motion.h1>
          <motion.h1
            className='font-poppins text-center text-xl font-bold md:pt-0'
            variants={fadeInAnimationVariants}
            custom={1}
          >
            Get Started Now!
          </motion.h1>
        </div>
        <motion.div variants={fadeInAnimationVariants} custom={0}>
          <Image
            src={ProfileScreenshot}
            className='h-[32rem] justify-self-center object-scale-down drop-shadow-lg md:h-[42rem]'
            alt='Screenshot of the profile page'
          />
        </motion.div>
        <motion.div variants={fadeInAnimationVariants} custom={0.2}>
          <ButtonLink href='/dashboard' rightIcon={LogIn}>
            Sign Up
          </ButtonLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
