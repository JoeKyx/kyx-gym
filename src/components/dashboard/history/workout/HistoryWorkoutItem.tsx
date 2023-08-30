import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';
import React from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import HistoryWorkoutSet from '@/components/dashboard/history/workout/HistoryWorkoutSet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

import { HistoryWorkoutItem } from '@/types/Workout';

type HistoryWorkoutItemProps = HTMLAttributes<HTMLDivElement> & {
  workoutItem: HistoryWorkoutItem;
};

const HistoryWorkoutItem: FC<HistoryWorkoutItemProps> = forwardRef<
  HTMLDivElement,
  HistoryWorkoutItemProps
>((props, ref) => {
  const { className, workoutItem, ...rest } = props;
  const musclesUsed = workoutItem.exercises?.muscles
    ?.map((muscle) => muscle.name)
    .join(', ');
  logger(workoutItem.exercises?.type, 'type');

  const firstColumn = () => {
    if (workoutItem.exercises?.type === 'weight') {
      return 'Reps';
    } else if (workoutItem.exercises?.type === 'speed') {
      return 'Minutes';
    } else {
      return 'Reps';
    }
  };

  const secondColumn = () => {
    logger(workoutItem.exercises?.type, 'type');
    if (workoutItem.exercises?.type === 'weight') {
      return 'Weight';
    } else {
      return 'Kilometers';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg bg-white p-4 py-4 shadow-md',
        className
      )}
      ref={ref}
      {...rest}
    >
      <div className='flex items-center justify-between'>
        <Popover>
          <PopoverTrigger>
            <span className='text-primary-500 text-lg font-semibold'>
              {workoutItem.exercises?.name}
            </span>
          </PopoverTrigger>
          <PopoverContent>{workoutItem.exercises?.description}</PopoverContent>
        </Popover>
        <span className='text-sm text-gray-500'>{musclesUsed}</span>
      </div>
      <div className='flex flex-col pb-3'>
        <div className='flex flex-row items-center '>
          <span className='text-primary-600 w-16 text-left font-semibold'>
            Sets
          </span>
          <span className='w-20 text-left text-sm text-gray-500'>
            {firstColumn()}
          </span>
          {(workoutItem.exercises?.type === 'weight' ||
            workoutItem.exercises?.type === 'speed') && (
            <span className='w-20 text-left text-sm text-gray-500'>
              {secondColumn()}
            </span>
          )}
          <span className='w-6 text-left text-sm text-gray-500 md:w-16'>
            Type
          </span>
        </div>
        {workoutItem.sets.map((set, index) => (
          <React.Fragment key={index}>
            <HistoryWorkoutSet
              set={set}
              setNr={index + 1}
              exerciseType={workoutItem.exercises?.type || 'weight'}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export default HistoryWorkoutItem;
