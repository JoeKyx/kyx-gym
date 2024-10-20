'use client';
import { motion } from 'framer-motion';
import React from 'react';

import FakeAiResponse from '@/components/home/FakeAiResponse';
import WorkoutAccordion from '@/components/home/WorkoutAccordion';

export default function KyxAi() {
  return (
    <section
      className='flex w-full flex-col items-center justify-center bg-slate-200 pt-40 md:h-screen md:pt-24'
      id='ai'
    >
      <motion.h1
        className='font-poppins pb-10 text-center text-5xl font-bold md:pb-20'
        initial={{ y: 20, opacity: 0 }} // Start with the content fully clipped
        whileInView={{ y: 0, opacity: 1 }} // End with the content fully revealed
        transition={{ duration: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        Experience <span className='text-primary-500'>Kyx</span>AI
      </motion.h1>
      <motion.div
        className='flex w-4/5 flex-col gap-20 md:flex-row'
        initial={{ y: 50, opacity: 0 }} // Start with the content fully clipped
        whileInView={{ y: 0, opacity: 1 }} // End with the content fully revealed
        transition={{ duration: 0.4, delay: 0.4 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <WorkoutAccordion className='md:w-1/3' />
        <FakeAiResponse className='md:w-2/3' />
      </motion.div>
    </section>
  );
}
