'use client';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { useProfile } from '@/components/context/ProfileContext';
import HistoryWorkoutHeadArea from '@/components/dashboard/history/workout/HistoryWorkoutHeadArea';
import HistoryWorkoutItem from '@/components/dashboard/history/workout/HistoryWorkoutItem';

import { HistoryWorkout } from '@/types/Workout';

type HistoryWorkoutProps = HTMLAttributes<HTMLDivElement> & {
  workout: HistoryWorkout;
};

const HistoryWorkout: FC<HistoryWorkoutProps> = forwardRef<
  HTMLDivElement,
  HistoryWorkoutProps
>((props, ref) => {
  const { className, workout, ...rest } = props;

  const [workoutState, _setWorkoutState] = useState(workout);

  const profileContext = useProfile();
  const owner = profileContext.userProfile;

  const isOwn = profileContext.isOwn;

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...rest}>
      <HistoryWorkoutHeadArea
        workout={workoutState}
        isOwn={isOwn}
        userProfile={owner}
      />
      {workout.workout_items.map((item, index) => (
        <HistoryWorkoutItem key={index} workoutItem={item} />
      ))}
    </div>
  );
});

export default HistoryWorkout;
