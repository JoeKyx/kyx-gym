import Image from 'next/image';
import React, { FC, useState } from 'react';
import { animated, useInView, useTransition } from 'react-spring';
import { useSwipeable } from 'react-swipeable';

import Button from '@/components/buttons/Button';

const TrackYourWorkouts = () => {
  return (
    <>
      <p className='mb-3 text-lg'>
        Keep track of your workouts and see your progress over time.
      </p>
      <p>
        Kyx Gym offers you a simple but flexible way to track your workouts.
        Just select the exercises you want to do and start your workout. Are we
        missing an exercise? No problem, you can create your own custom
        exercises.
      </p>
      <ul className='list-inside space-y-1 py-2 pl-5'>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Over 100+ predefined Exercises
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Create your own custom exercises
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Keep track of your personal records
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Save your workouts as templates for later use
        </li>
      </ul>
      <p>And many more features!</p>
    </>
  );
};

const CompleteChallenges = () => {
  return (
    <>
      <p className='mb-3 text-lg'>Complete challenges and earn rewards.</p>
      <p>
        Whilst ninjas are known for their intrinsic motivation, it is always
        nice to get some extra motivation. That is why Kyx Gym offers you the
        ability to complete challenges and earn rewards.
      </p>
      <ul className='list-inside space-y-1 py-2 pl-5'>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Over 50 fun and challenging challenges
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Earn unique icons to display your achievements
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Collect challenge points and compare yourself to other ninjas
        </li>
        <li className='transition duration-200 ease-in-out hover:font-semibold'>
          Experience challenges themed around holidays and events
        </li>
      </ul>
    </>
  );
};

const TrackYourProgress = () => {
  return (
    <>
      <p className='mb-3 text-lg'>
        Track your progress and see how you improve over time.
      </p>
      <p>
        Want to know how much you have improved over the last month? Or maybe
        you want to know what was your all time volume record at the bench
        press? Kyx Gym offers you extensive statistics to track your progress.
      </p>
    </>
  );
};

const images = [
  {
    src: '/images/screenshots/workout.png',
    title: 'Track your Workouts',
    element: <TrackYourWorkouts />,
  },
  {
    src: '/images/screenshots/challenges.png',
    title: 'Complete Challenges',
    element: <CompleteChallenges />,
  },
  {
    src: '/images/screenshots/profile.png',
    title: 'Watch your Gains',
    element: <TrackYourProgress />,
  },
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
    <>
      <div
        className='relative h-full bg-black bg-opacity-60 md:hidden'
        {...swipeHandlers}
      >
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
                  height={400}
                  alt='App Screenshot'
                  priority
                  placeholder='empty'
                />
                {/* prefetch next image */}
                <Image
                  src={images[(index + 1) % images.length].src}
                  className='invisible'
                  quality={100}
                  layout='fill'
                  objectFit='contain'
                  alt='App Screenshot'
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

      {/* Desktop view */}
      <div className='relative hidden h-full bg-black bg-opacity-60 md:block'>
        <Image
          src='/images/bg/ancient_ninja_gym.jpeg'
          layout='fill'
          objectFit='cover'
          alt='Background Image'
          className='-z-20'
        />
        <div className='flex h-full  items-center'>
          <div className='flex h-full w-full flex-col items-center justify-between pb-8 pt-28'>
            <div className='flex h-5/6 w-full'>
              {/* Image container */}
              <div
                className={`flex w-1/3 flex-col items-center justify-center transition-opacity duration-300 `}
              >
                {images.map((image, i) => (
                  <Image
                    key={image.title}
                    src={image.src}
                    className={`absolute ${
                      index === i ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-500`}
                    width={250}
                    height={400}
                    alt='App Screenshot'
                    priority
                    placeholder='empty'
                  />
                ))}
              </div>

              {/* Text container */}
              <div className='flex w-1/3 flex-col items-center justify-between transition-opacity duration-300'>
                <div></div>
                {images.map((image, i) => (
                  <div
                    className={`absolute ${
                      index === i ? 'z-10 opacity-100' : '-z-10 opacity-0'
                    } w-1/3 transition-opacity duration-500`}
                    key={image.title}
                  >
                    <h2 className='font-bold text-white drop-shadow'>
                      {image.title}
                    </h2>
                    <div className='text-white'>{image.element}</div>
                  </div>
                ))}
                <div className='flex flex-col items-center gap-3'>
                  <span className='text-center text-white'>
                    Do you have what it takes to become a Kyx Ninja?{' '}
                  </span>
                  <Button onClick={handleJoinNowClick}>Join Now!</Button>
                </div>
              </div>

              {/* Menu */}
              <div className='flex w-1/3 cursor-pointer flex-col items-center gap-8'>
                {images.map((image, i) => (
                  <div
                    key={image.title}
                    className='relative flex h-16 w-full transform items-center justify-end overflow-hidden rounded-lg p-5 transition duration-200 ease-in-out hover:scale-105'
                    onClick={() => setIndex(i)}
                  >
                    {/* Gradient Overlay */}
                    <div
                      className={`transition-width absolute inset-y-0 right-0 bg-gradient-to-r from-transparent to-red-900 duration-500 ${
                        i === index ? 'w-full' : 'w-0'
                      }`}
                    ></div>

                    <span className='relative font-bold uppercase tracking-wider text-white'>
                      {image.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Information;
