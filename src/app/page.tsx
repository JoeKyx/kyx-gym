import { Github, Twitter } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FC } from 'react';

import Challenges from '@/components/home/Challenges';
import GetStarted from '@/components/home/GetStarted';
import Intro from '@/components/home/Intro';
import KyxAi from '@/components/home/KyxAi';
import Navbar from '@/components/home/Navbar';
import Stats from '@/components/home/Stats';
import WorkoutInfo from '@/components/home/WorkoutInfo';

export const metadata: Metadata = {
  title: 'Kyx Gym - Welcome',
  description:
    'Welcome to Kyx Gym! A gym tracking app that helps you keep track of your workouts and progress.',
};

const page: FC = () => {
  return (
    <div>
      <Navbar />
      <Intro />
      <WorkoutInfo />
      <Challenges />
      <KyxAi />
      <Stats />
      <GetStarted />
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
