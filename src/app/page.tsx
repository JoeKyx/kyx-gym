import { Github, LogIn, Twitter } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import FakeStatsRadar from '@/components/home/FakeStatsRadar';
import Navbar from '@/components/home/Navbar';
import ButtonLink from '@/components/links/ButtonLink';

export const metadata: Metadata = {
  title: 'Kyx Gym - Welcome',
  description:
    'Welcome to Kyx Gym! A gym tracking app that helps you keep track of your workouts and progress.',
};

const page: FC = () => {
  const features = [
    {
      name: 'Workout Tracking',
      image: '/images/dashboard/newWorkoutMobile.jpeg',
      href: '#workout',
    },
    {
      name: 'Challenges',
      image: '/images/dashboard/comingSoonMobile.jpeg',
      href: '#challenges',
    },
    {
      name: 'Statistics',
      image: '/images/dashboard/statsMobile.jpeg',
      href: '#statistics',
    },
  ];

  return (
    <div>
      <Navbar />
      <div className='flex h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-slate-200 pt-10'>
        <div className='flex flex-col items-center'>
          <Image
            src='/images/kgLogo.png'
            width={250}
            height={250}
            alt='logo of Kyx Gym'
          />
          <h1 className='font-poppins text-4xl font-bold'>
            Focus on your Workout
          </h1>
          <h1 className='font-poppins text-5xl font-bold'>
            Let <span className='text-primary-500'>Kyx</span> do the rest
          </h1>
        </div>
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
        <div className='mt-10 hidden h-48 w-full grid-cols-3 gap-2 px-6 md:grid md:w-4/6 md:gap-20'>
          {features.map((feature, index) => (
            <Link
              href={feature.href}
              key={index}
              className='relative h-full w-full overflow-hidden rounded-md border border-gray-500 drop-shadow-lg transition-all duration-300 ease-in-out hover:scale-105'
            >
              <Image
                src={feature.image}
                fill
                alt={feature.name}
                className='absolute inset-0 h-full w-full object-cover'
              />
              <h2 className='font-poppins absolute bottom-0 right-2 text-left text-2xl font-bold text-white'>
                {feature.name}
              </h2>
            </Link>
          ))}
        </div>
      </div>
      <div className='flex w-full items-center bg-slate-200' id='workout'>
        <div className='flex w-full flex-col items-center justify-center gap-10 md:flex-row md:gap-2 md:py-36'>
          <div className='flex h-full w-1/2 items-start justify-center '>
            <Image
              src='/images/screenshots/workout.png'
              width={300}
              height={469}
              alt='screenshot of workout tracking'
            />
          </div>
          <div className='flex h-full w-1/2 flex-col items-start justify-start'>
            <h1 className='font-poppins text-center text-5xl font-bold'>
              Workout Tracking
            </h1>
            <p className='text-center text-2xl font-semibold md:text-start'>
              Keep track of your workouts.
            </p>
            <p className='text-center text-2xl font-semibold opacity-90 md:text-start'>
              See what you have lifted previously.
            </p>
            <p className='text-center text-2xl font-semibold opacity-80 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              Instant feedback on new records.
            </p>
            <p className='text-center text-2xl font-semibold opacity-70 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              Over 200 predefined exercises.
            </p>
            <p className='text-center text-2xl font-semibold opacity-60 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              Ability to add your own exercises.
            </p>
            <p className='text-center text-2xl font-semibold opacity-50 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              Filter exercises by muscle group or category.
            </p>
            <p className='text-center text-2xl font-semibold opacity-40 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              How-to descriptions for each exercise.
            </p>
            <p className='text-center text-2xl font-semibold opacity-30 transition-opacity duration-300 ease-in-out hover:opacity-100 md:text-start'>
              Drop sets, Supersets, Warmup sets.
            </p>
            <p className='font-poppins mt-8 hidden text-center  text-5xl font-bold md:block md:text-start'>
              Easy & Effective
            </p>
          </div>
        </div>
      </div>
      <div
        className='flex w-full flex-col items-center justify-center bg-slate-200 pt-40 md:pt-20'
        id='challenges'
      >
        <div className='flex w-full flex-col items-center md:w-1/3 '>
          <h1 className='font-poppins text-center text-5xl font-bold drop-shadow-lg md:pt-0 '>
            Challenges
          </h1>
          <p className='text-2xl font-semibold'>
            Complete objectives. Earn rewards.
          </p>
        </div>
        <div className='flex w-5/6 flex-col pt-20 md:flex-row md:pt-0'>
          <div className='flex  w-full flex-col items-start gap-5 md:h-full md:w-1/3 md:pt-24'>
            <div className='flex  items-center'>
              <Image
                src='/images/avatars/art_of_war.jpeg'
                width={120}
                height={120}
                alt='Art of War Mission image'
                className='rounded-full border border-slate-600'
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
          </div>
          <div className='hidden h-fit w-1/3 justify-center md:flex'>
            <Image
              src='/images/features/challenges_trophy.png'
              width={300}
              height={200}
              className='justify-self-center pt-14 drop-shadow-lg'
              alt='A trophy'
            />
          </div>
          <div className='flex w-full flex-col items-start gap-5 pt-20 md:h-full md:w-1/3  md:pt-24'>
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
                src='/images/avatars/martial_arts_mastery.jpeg'
                width={120}
                height={120}
                alt='Martial Arts Mastery Mission image'
                className='rounded-full border border-slate-600'
              />
            </div>
          </div>
          <div className='flex  w-full  flex-col items-start gap-5 pt-20 md:hidden'>
            <div className='flex  items-center'>
              <Image
                src='/images/avatars/climbing_the_ladder.jpeg'
                width={120}
                height={120}
                alt='Climbin the Ladder image'
                className='rounded-full border border-slate-600'
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
          </div>
        </div>
      </div>
      <div
        className='flex w-full flex-col items-center justify-center bg-slate-200 pt-40 md:pt-20'
        id='statistics'
      >
        <div className='flex w-5/6 flex-col-reverse pt-20  md:flex-row md:pt-0'>
          <FakeStatsRadar className='w-full items-start justify-center gap-5 md:w-1/3 md:pt-24' />
          <div className='flex w-full flex-col md:w-2/3 md:items-end md:pt-24'>
            <h1 className='font-poppins text-start text-5xl font-bold drop-shadow-lg'>
              Statistics
            </h1>
            <p className='text-2xl font-semibold'>See your progress.</p>
            <p className='text-2xl font-semibold'>Gain insights.</p>
            <p className='text-2xl font-semibold'>Find your weaknesses.</p>
            <p className='text-2xl font-semibold'>Improve your strengths.</p>
          </div>
        </div>
      </div>

      <div className='flex flex-col items-center justify-center gap-12 bg-gradient-to-b  from-slate-200 to-slate-100 pb-20 md:flex-row'>
        <div className='flex flex-col items-center'>
          <h1 className='font-poppins text-center text-5xl font-bold md:pt-0 '>
            <span className='text-primary-500'>Kyx</span>Gym
          </h1>
          <h1 className='font-poppins text-center text-xl font-bold md:pt-0 '>
            Get Started Now!
          </h1>
        </div>
        <Image
          src='/images/screenshots/profile.png'
          width={240}
          height={500}
          className='justify-self-center drop-shadow-lg'
          alt='A trophy'
        />
        <ButtonLink href='/dashboard' rightIcon={LogIn}>
          Sign Up
        </ButtonLink>
      </div>
      <footer className='flex w-full bg-white px-20 py-20'>
        <div className='flex flex-col'>
          <div>
            <span className='font-poppins font-lg font-bold'>
              <span className='text-primary-500'>Kyx</span>Gym
            </span>
          </div>
          <div className='font-light text-gray-400'>Gym Tracking Made Easy</div>

          <div className='flex pt-5'>
            <Link
              href='https://github.com/JoeKyx'
              target='_blank'
              rel='noopener noreferrer'
              className='font-light text-gray-900 '
            >
              <Github className='hover:fill-primary-300 h-6 w-6 transition-all duration-500 ease-in-out' />
            </Link>
            <span className='px-2'>|</span>
            <Link
              href='https://x.com/JoeKyx'
              target='_blank'
              rel='noopener noreferrer'
              className='font-light text-gray-900 '
            >
              <Twitter className='hover:fill-primary-300 h-6 w-6 transition-all duration-500 ease-in-out' />
            </Link>
          </div>
          <div>
            <span className='font-light text-gray-400'>by Joe Kyx</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default page;
