'use client';
import { motion } from 'framer-motion';
import React from 'react';

import FakeStatsRadar from '@/components/home/FakeStatsRadar';

const fadeInAnimationVariants = {
  offscreen: {
    opacity: 0,
    y: 20,
  },
  onscreen: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 1 + index * 0.15,
      duration: 0.5,
      type: 'tween',
    },
  }),
};

export default function Stats() {
  return (
    <motion.div
      initial='offscreen'
      whileInView='onscreen'
      viewport={{ once: true, amount: 0.3 }}
    >
      <section
        className='flex w-full  justify-center overflow-hidden bg-slate-200 pt-40 md:pb-20 md:pt-20'
        id='statistics'
      >
        <div className='!mx-0 flex h-full flex-col-reverse  items-start justify-center !px-0 pt-20 md:w-5/6 md:flex-row-reverse  md:items-center md:pt-0'>
          <motion.div variants={fadeInAnimationVariants} custom={-0.5}>
            <FakeStatsRadar className='h-full w-full  justify-center gap-5 md:w-1/2' />
          </motion.div>
          <div className='flex w-full flex-col  items-center md:items-start md:justify-center md:pt-24'>
            <motion.h1
              className='font-poppins text-start  text-5xl font-bold drop-shadow-lg'
              variants={fadeInAnimationVariants}
              custom={0}
            >
              Statistics
            </motion.h1>
            <div className='items-center md:items-start '>
              {features.map((feature, index) => (
                <motion.p
                  key={index}
                  className='text-2xl font-semibold md:self-center'
                  variants={fadeInAnimationVariants}
                  custom={index}
                >
                  {feature}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

const features = [
  'See your progress.',
  'Gain insights.',
  'Find your weaknesses.',
  'Improve your strengths.',
];
