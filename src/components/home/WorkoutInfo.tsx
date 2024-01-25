'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

import workout from '../../../public/images/screenshots/workout.png';

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

const underlineAnimation = {
  offscreen: { width: 0 },
  onscreen: (index: number) => ({
    width: '100%',
    transition: {
      delay: 1.5 + index * 0.15, // Adjust the delay to start after the text animation
      duration: 0.7,
      ease: 'easeInOut',
    },
  }),
};

export default function WorkoutInfo() {
  return (
    <section
      className='flex w-full items-center bg-slate-200 md:h-screen'
      id='workout'
    >
      <motion.div
        className='flex w-full flex-col items-center justify-center gap-10 md:flex-row md:gap-2 md:py-36'
        initial='offscreen'
        whileInView='onscreen'
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className='flex h-full w-1/2 items-start justify-center'>
          <motion.div
            variants={{
              offscreen: {
                opacity: 0,
                y: 100,
              },
              onscreen: {
                opacity: 1,
                y: 0,
                transition: {
                  delay: 1,
                  duration: 1.4,
                  type: 'spring',
                },
              },
            }}
          >
            <Image
              src={workout}
              alt='screenshot of workout tracking'
              className='h-[41rem]  object-scale-down drop-shadow-lg'
              quality={95}
            />
          </motion.div>
        </div>
        <div className='flex h-full w-1/2 flex-col items-start justify-start'>
          <motion.h1
            className='font-poppins text-center text-5xl font-bold'
            variants={fadeInAnimationVariants}
            custom={-1}
          >
            Workout Tracking
          </motion.h1>
          <ul>
            {paragraphs.map((paragraph, index) => (
              <motion.li
                key={index}
                className='text-center text-2xl font-semibold opacity-90 hover:opacity-100 md:text-start'
                variants={fadeInAnimationVariants}
                custom={index}
              >
                {paragraph}
              </motion.li>
            ))}
          </ul>

          <motion.p
            className='font-poppins mt-8 hidden text-center  text-5xl font-bold md:block md:text-start'
            variants={fadeInAnimationVariants}
            custom={paragraphs.length + 3}
          >
            Easy & Effective
            <motion.span
              className='block h-[0.1rem] rounded-full bg-black/80' // Replace bg-black with the color of your choice for the underline
              variants={underlineAnimation}
              custom={paragraphs.length + 5}
            />
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

const paragraphs = [
  'Keep track of your workouts.',
  'See what you have lifted previously.',
  'Instant feedback on new records.',
  'Over 200 predefined exercises.',
  'Ability to add your own exercises.',
  'Filter exercises by muscle group or category.',
  'How-to descriptions for each exercise.',
  'Drop sets, Supersets, Warmup sets.',
];
