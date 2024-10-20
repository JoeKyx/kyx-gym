import Image from 'next/image';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const infoTopRef = useRef<HTMLDivElement>(null!);

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
      rootMargin: '-40% 0%',
      once: true,
    }
  );

  // desktop springs
  const [refPart1, springsPart1] = useInView(
    () => ({
      from: {
        opacity: 0,
        x: -120,
      },
      to: {
        opacity: 1,
        x: 0,
      },
    }),
    {
      rootMargin: '-40% 0%',
    }
  );

  const [refPart2, springsPart2] = useInView(
    () => ({
      from: {
        opacity: 0,
        x: -120,
      },
      to: {
        opacity: 1,
        x: 0,
      },
    }),
    {
      rootMargin: '-40% 0%',
    }
  );

  const [refPart3, springsPart3] = useInView(
    () => ({
      from: {
        opacity: 0,
        x: -120,
      },
      to: {
        opacity: 1,
        x: 0,
      },
    }),
    {
      rootMargin: '-50% 0%',
    }
  );

  const getMostVisibleSection = useCallback(() => {
    if (!refPart1.current || !refPart2.current || !refPart3.current) {
      return;
    }

    const offsets = [
      refPart1.current.getBoundingClientRect().top,
      refPart2.current.getBoundingClientRect().top,
      refPart3.current.getBoundingClientRect().top,
    ];

    // Getting the absolute values because we are interested in the distance from the top of the viewport
    const absoluteOffsets = offsets.map(Math.abs);

    // Find the minimum value
    const minOffset = Math.min(...absoluteOffsets);

    // Return the index of the section with the smallest offset
    return absoluteOffsets.indexOf(minOffset);
  }, [refPart1, refPart2, refPart3]);

  useEffect(() => {
    const handleScroll = () => {
      const visibleIndex = getMostVisibleSection();
      if (visibleIndex !== undefined) {
        setIndex(visibleIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup the listener when the component is unmounted
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [getMostVisibleSection]);

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

  const scrollToPart = (i: number) => {
    switch (i) {
      case 0:
        refPart1.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 1:
        refPart2.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 2:
        refPart3.current?.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  };

  return (
    <>
      <div
        className='relative h-full bg-black bg-opacity-60 md:hidden'
        {...swipeHandlers}
        ref={infoTopRef}
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
      {/* Put dark filter over bg image */}
      <div
        className='relative z-20 hidden h-full bg-black bg-opacity-60 md:flex'
        ref={infoTopRef}
        style={{
          backgroundImage: `url('/images/bg/ancient_ninja_gym.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className='absolute inset-0 -z-10 bg-black bg-opacity-60'></div>
        <div className='flex items-start justify-between'>
          <main className='w-2/3'>
            <animated.div
              ref={refPart1}
              style={springsPart1}
              className='flex h-screen w-full items-center justify-between pl-20'
              key={images[0].title}
            >
              <div className='flex items-center gap-24'>
                <Image
                  src={images[0].src}
                  width={250}
                  height={400}
                  alt='App Screenshot'
                  priority
                  placeholder='empty'
                />
                <div>
                  <h2 className='font-bold text-white drop-shadow'>
                    {images[0].title}
                  </h2>
                  <div className='text-white'>{images[2].element}</div>
                </div>
              </div>
            </animated.div>
            <animated.div
              ref={refPart2}
              style={springsPart2}
              className='flex h-screen w-full items-center justify-between pl-20'
              key={images[1].title}
            >
              <div className='flex items-center gap-24'>
                <Image
                  src={images[1].src}
                  width={250}
                  height={400}
                  alt='App Screenshot'
                  priority
                  placeholder='empty'
                />
                <div>
                  <h2 className='font-bold text-white drop-shadow'>
                    {images[1].title}
                  </h2>
                  <div className='text-white'>{images[1].element}</div>
                </div>
              </div>
            </animated.div>{' '}
            <animated.div
              ref={refPart3}
              style={springsPart3}
              className='flex h-screen w-full items-center justify-between pl-20'
              key={images[2].title}
            >
              <div className='flex items-center gap-24'>
                <Image
                  src={images[2].src}
                  width={250}
                  height={400}
                  alt='App Screenshot'
                  priority
                  placeholder='empty'
                />
                <div>
                  <h2 className='font-bold text-white drop-shadow'>
                    {images[2].title}
                  </h2>
                  <div className='text-white'>{images[2].element}</div>
                </div>
              </div>
            </animated.div>
          </main>
          <aside className='sticky top-0 pt-72'>
            {images.map((image, i) => (
              // onClick Scroll to the section
              <div
                key={image.title}
                className='relative flex h-16 w-full transform cursor-pointer items-center justify-end overflow-hidden rounded-lg p-5 transition duration-200 ease-in-out hover:scale-95'
                onClick={() => scrollToPart(i)}
              >
                <animated.div
                  className={`transition-width absolute inset-y-0 right-0 bg-gradient-to-r from-transparent to-red-900 duration-500 ${
                    i === index ? 'w-full' : 'w-0'
                  }`}
                ></animated.div>

                <span className='relative font-bold uppercase tracking-wider text-white'>
                  {image.title}
                </span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
};

export default Information;
