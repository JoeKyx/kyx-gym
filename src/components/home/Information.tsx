import Image from 'next/image';
import React, { FC, useState } from 'react';
import { animated, useInView, useTransition } from 'react-spring';
import { useSwipeable } from 'react-swipeable';

import Button from '@/components/buttons/Button';

const images = [
  { src: '/images/screenshots/workout.png', title: 'Track your Workouts' },
  { src: '/images/screenshots/challenges.png', title: 'Complete Challenges' },
  { src: '/images/screenshots/profile.png', title: 'Track your Progress' },
];

interface InformationProps {
  refToScroll?: React.RefObject<HTMLDivElement>;
}

const Information: FC<InformationProps> = ({ refToScroll }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 0: next, 1: prev

  const [ref, springs] = useInView(
    () => ({
      from: {
        opacity: 0,
        y: 120,
      },
      to: {
        opacity: 1,
        y: 0,
      },
    }),
    {
      rootMargin: '-40% 0px -60% 0px',
      once: true,
    }
  );

  const [ref2, springs2] = useInView(
    () => ({
      from: {
        opacity: 0,
        y: 80,
      },
      to: {
        opacity: 1,
        y: 0,
      },
    }),
    {
      rootMargin: '0px 0px -30% 0px',
      once: true,
    }
  );

  const transitions = useTransition(images[index] ?? null, {
    from: {
      opacity: 0,
      transform:
        direction === 0 ? 'translate3d(100%,0,0)' : 'translate3d(-100%,0,0)',
    },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: {
      opacity: 0,
      transform:
        direction === 0 ? 'translate3d(-100%,0,0)' : 'translate3d(100%,0,0)',
    },
    config: { duration: 500 },
    keys: (item) => item?.src,
  });

  const next = () => {
    setDirection(0);
    setIndex((state) => (state + 1) % images.length);
  };

  const prev = () => {
    setDirection(1);
    setIndex((state) => (state + images.length - 1) % images.length);
  };

  const handleJoinNowClick = () => {
    if (refToScroll) {
      refToScroll.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
  });

  return (
    <div className='relative h-full bg-black bg-opacity-60' {...swipeHandlers}>
      <Image
        src='/images/bg/ancient_ninja_gym.jpeg'
        layout='fill'
        objectFit='cover'
        alt='Background Image'
        className='-z-20'
      />

      <div className='flex h-full flex-col items-center justify-between'>
        <div className='flex flex-col items-center justify-center'>
          <animated.h2
            style={springs}
            ref={ref}
            className='mb-4 mt-10 text-center text-4xl font-bold text-white drop-shadow-md filter'
          >
            Find Your Inner Ninja
          </animated.h2>
          <animated.h2
            style={springs}
            className='text-2xl font-semibold text-white drop-shadow-md filter'
          >
            Focus on your training
          </animated.h2>
        </div>
        <Button onClick={handleJoinNowClick} className='mb-10'>
          Join Now
        </Button>
      </div>

      {transitions(
        (style, item) =>
          item && (
            <animated.div
              style={{ ...style, top: '18%', ...springs2 }}
              ref={ref2}
              className='absolute flex w-full flex-col items-center'
            >
              <Image
                src={item.src}
                width={250}
                height={500}
                alt='App Screenshot'
                priority
                placeholder='empty'
              />
              <div className='mt-4 text-white'>
                <h2 className='text-xl font-semibold'>{item.title}</h2>
              </div>
            </animated.div>
          )
      )}

      <button
        onClick={prev}
        className='absolute left-0 top-1/2 -translate-y-2/4 transform text-4xl text-white'
      >
        &larr;
      </button>
      <button
        onClick={next}
        className='absolute right-0 top-1/2 -translate-y-2/4 transform text-4xl text-white'
      >
        &rarr;
      </button>
    </div>
  );
};

export default Information;
