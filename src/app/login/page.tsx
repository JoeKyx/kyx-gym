'use client';
import { FC } from 'react';
import { animated, useInView } from 'react-spring';

import { cn } from '@/lib';

import AuthForm from '@/components/AuthForm';

const Page: FC = () => {
  const [loginHeaderRef, loginHeaderSpring] = useInView(
    () => ({
      from: {
        opacity: 0,
        y: 100,
      },
      to: {
        opacity: 1,
        y: 0,
      },
    }),
    {
      rootMargin: '-30% 0%',
    }
  );

  return (
    <div className={cn(' flex h-full flex-col items-center justify-center')}>
      <div
        // gradient background color
        className='flex w-full items-center justify-center'
      >
        <div className='flex flex-col items-center justify-center md:w-3/4 md:flex-row md:items-start md:gap-20'>
          <animated.div
            className='flex flex-col md:h-full'
            ref={loginHeaderRef}
            style={loginHeaderSpring}
          >
            <h1 className='font-poppins text-4xl font-extrabold tracking-wider md:text-9xl'>
              <span className='text-primary-500'>Kyx</span>Gym
            </h1>
            <h2 className='text-end text-2xl tracking-wider text-slate-700'>
              LOGIN
            </h2>
          </animated.div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Page;
