'use client';
import _ from 'lodash';
import { FC, useCallback, useMemo } from 'react';
import { HTMLAttributes } from 'react';

import { useProfile } from '@/components/context/ProfileContext';
import WorkoutName from '@/components/dashboard/WorkoutName';
import WorkoutRating from '@/components/dashboard/WorkoutRating';
import ButtonLink from '@/components/links/ButtonLink';

import { DBWorkout } from '@/types/Workout';

type WorkoutContainerProps = HTMLAttributes<HTMLInputElement> & {
  workout: DBWorkout;
};

const WorkoutContainer: FC<WorkoutContainerProps> = ({ workout }) => {
  const profileContext = useProfile();

  const isOwnWorkout = profileContext.isOwn;

  const date = new Date(workout.created_at).toDateString();

  const updateName = useMemo(
    () => async (name: string) => {
      await profileContext.updateWorkoutName(name, workout.id);
    },
    [profileContext, workout.id]
  );

  const debouncedUpdateWorkoutName = useMemo(
    () => _.debounce(updateName, 5000),
    [updateName]
  );

  const muscleName = workout.mainmuscle
    ? profileContext.muscleResolver(workout.mainmuscle)
    : 'No muscle';

  const handleWorkoutNameChange = useCallback(
    (name: string) => {
      if (!workout || name.length === 0) return;
      debouncedUpdateWorkoutName(name);
    },
    [debouncedUpdateWorkoutName, workout]
  ); // Add other dependencies if necessary

  return (
    <div className='mb-4 flex rounded-md border bg-white p-4 shadow-lg'>
      <div className='flex flex-grow flex-col'>
        <WorkoutName
          workout={workout}
          isOwnWorkout={isOwnWorkout}
          onNewName={handleWorkoutNameChange}
        />
        <p className='mb-2 text-sm text-gray-500'>{date}</p>
        <WorkoutRating workout={workout} isOwnWorkout={isOwnWorkout} />
      </div>
      <div className='flex flex-col items-end justify-between'>
        <p className='text-sm text-gray-500'>{muscleName}</p>
        <ButtonLink
          href={`/dashboard/profile/${profileContext.userProfile.username}/history/${workout.id}`}
          variant='light'
        >
          View
        </ButtonLink>
      </div>
    </div>
  );
};

export default WorkoutContainer;
