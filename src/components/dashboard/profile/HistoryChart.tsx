'use client';
import { AreaChart, Card, Title } from '@tremor/react';
import { ValueFormatter } from '@tremor/react';
import { differenceInMinutes } from 'date-fns';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { useProfile } from '@/components/context/ProfileContext';
import ButtonLink from '@/components/links/ButtonLink';

import { DBWorkout } from '@/types/Workout';

type HistoryChartProps = HTMLAttributes<HTMLDivElement>;

const HistoryChart: FC<HistoryChartProps> = forwardRef<
  HTMLDivElement,
  HistoryChartProps
>(({ className, ...props }, ref) => {
  const profileContext = useProfile();

  const [categoryToShow, setCategoryToShow] = useState<string>('Weight');

  // From the lastWorkouts array, create an array with objects that contain: date, total weight, total reps, total sets
  // Then, sort the array by date

  const lastWorkouts = profileContext.workouts;

  const transformedWorkouts = lastWorkouts.map((workout: DBWorkout) => {
    return {
      date: new Date(workout.created_at),
      Weight: workout.total_weight ? workout.total_weight : 0,
      Stars: workout.rating ? workout.rating : 0,
      Duration: workout.finished_at
        ? differenceInMinutes(
            new Date(workout.finished_at),
            new Date(workout.created_at)
          )
        : 0,
    };
  });

  // Sort the array by date (asc)
  const chartWorkouts = transformedWorkouts
    .sort((a, b) => {
      return a.date.getTime() - b.date.getTime(); // use Date objects to sort
    })
    .map((workout) => {
      // convert date to string after sorting
      return {
        ...workout,
        date: workout.date.toLocaleDateString(),
      };
    });

  const color = (category: string) => {
    switch (category) {
      case 'Weight':
        return 'emerald';
      case 'Duration':
        return 'fuchsia';
      case 'Stars':
        return 'yellow';
      default:
        return 'cyan';
    }
  };

  const weightFormatter: ValueFormatter = (value: number) => {
    return `${value} kg`;
  };

  const durationFormatter: ValueFormatter = (value: number) => {
    return `${value} min`;
  };

  const starFormatter: ValueFormatter = (value: number) => {
    return `${value} stars`;
  };

  const formatter = (category: string): ValueFormatter => {
    switch (category) {
      case 'Weight':
        return weightFormatter;
      case 'Duration':
        return durationFormatter;
      case 'Stars':
        return starFormatter;
      default:
        return durationFormatter;
    }
  };

  return (
    <Card className={className} {...props} ref={ref}>
      <Title className='text-center font-semibold'>
        Last {lastWorkouts.length} Workouts
      </Title>
      <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
        <div className='flex items-center justify-center space-x-4'>
          <button
            className={`w-20 rounded-md px-2 py-1 ${
              categoryToShow === 'Weight'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setCategoryToShow('Weight')}
          >
            Weight
          </button>
          <button
            className={`w-20 rounded-md px-2 py-1  ${
              categoryToShow === 'Duration'
                ? 'bg-fuchsia-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setCategoryToShow('Duration')}
          >
            Duration
          </button>
          <button
            className={`w-20 rounded-md px-2 py-1  ${
              categoryToShow === 'Stars'
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setCategoryToShow('Stars')}
          >
            Stars
          </button>
        </div>

        <ButtonLink
          className='items-center'
          href={`/dashboard/profile/${profileContext.userProfile?.username}/stats`}
        >
          Advanced Stats
        </ButtonLink>
      </div>
      <AreaChart
        valueFormatter={formatter(categoryToShow)}
        className='mt-4 h-80'
        data={chartWorkouts}
        index='date'
        categories={[categoryToShow]}
        colors={[color(categoryToShow)]}
        allowDecimals={false}
      />
    </Card>
  );
});

export default HistoryChart;
