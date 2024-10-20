'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

import artOfWar from '../../../public/images/avatars/art_of_war.jpeg';
import climbingTheLadder from '../../../public/images/avatars/climbing_the_ladder.jpeg';
import martialArtsMastery from '../../../public/images/avatars/martial_arts_mastery.jpeg';
import challengesTrophy from '../../../public/images/features/challenges_trophy.png';

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

export default function Challenges() {
  return (
    <motion.div
      initial='offscreen'
      whileInView='onscreen'
      viewport={{ once: true, amount: 0.3 }}
    >
      <section
        className='flex w-full flex-col items-center justify-center bg-slate-200 pt-40 md:h-screen md:pt-20'
        id='challenges'
      >
        <motion.div
          className='flex w-full flex-col items-center md:w-1/3'
          initial={{ y: 20, opacity: 0 }} // Start with the content fully clipped
          whileInView={{ y: 0, opacity: 1 }} // End with the content fully revealed
          transition={{ duration: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h1 className='font-poppins text-center text-5xl font-bold md:pt-0'>
            Challenges
          </h1>
          <p className='text-2xl font-semibold'>
            Complete objectives. Earn rewards.
          </p>
        </motion.div>

        <div className='flex w-5/6 flex-col pt-20 md:flex-row md:pt-0'>
          <motion.div
            className='flex  w-full flex-col items-start gap-5 md:h-full md:w-1/3 md:pt-24'
            variants={fadeInAnimationVariants}
            custom={1}
          >
            <div className='flex  items-center'>
              <Image
                src={artOfWar}
                alt='Art of War Mission image'
                className='h-28 w-28 rounded-full border border-slate-600'
              />
              <div className='ml-4 flex flex-col items-start'>
                <h3 className='font-poppins text-2xl font-bold'>Art of War</h3>
                <p className='text-xl font-semibold'>
                  Sun Tzu emphasized adaptability and unpredictability. Over 7
                  days, prove your ability to diversify by training at least 14
                  different muscles, showcasing your ability to remain versatile
                  in your workouts.
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className='hidden h-fit w-1/3 justify-center md:flex'
            variants={fadeInAnimationVariants}
            custom={2}
          >
            <Image
              src={challengesTrophy}
              className='h-96 justify-self-center object-scale-down pt-14 drop-shadow-lg'
              alt='A trophy'
            />
          </motion.div>
          <motion.div
            className='flex w-full flex-col items-start gap-5 pt-20 md:h-full md:w-1/3  md:pt-24'
            variants={fadeInAnimationVariants}
            custom={1.5}
          >
            <div className='flex items-center'>
              <div className='ml-4 flex flex-col items-start'>
                <h3 className='font-poppins text-2xl font-bold'>
                  Martial Arts Mastery
                </h3>
                <p className='text-xl font-semibold'>
                  Emulate the balance of a martial artist! Within a week, engage
                  in Bench Press (Barbell), Jump Rope, Running, Russian Twist,
                  and Box Jump.
                </p>
              </div>
              <Image
                src={martialArtsMastery}
                alt='Martial Arts Mastery Mission image'
                className='h-28 w-28 rounded-full  border border-slate-600'
              />
            </div>
          </motion.div>
          <motion.div className='flex  w-full  flex-col items-start gap-5 pt-20 md:hidden'>
            <div className='flex  items-center'>
              <Image
                src={climbingTheLadder}
                alt='Climbin the Ladder image'
                className='h-28 w-28 rounded-full  border border-slate-600'
              />
              <div className='ml-4 flex flex-col items-start'>
                <h3 className='font-poppins text-2xl font-bold'>
                  Climbing the ladder
                </h3>
                <p className='text-xl font-semibold'>
                  Push your boundaries. Complete a workout with at least 7
                  exercises where each subsequent exercise has more sets than
                  the previous one. Begin with a single set for the first
                  exercise and increment by one set for each subsequent
                  exercise.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
