'use client';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { useProfile } from '@/components/context/ProfileContext';
import HistoryWorkoutHeadArea from '@/components/dashboard/history/workout/HistoryWorkoutHeadArea';
import HistoryWorkoutItem from '@/components/dashboard/history/workout/HistoryWorkoutItem';
import { useIntegrationsEnabled } from '@/components/integrations/IntegrationAvailability';
import WorkoutFeedback from '@/components/integrations/WorkoutFeedback';
import WorkoutPlanComparison from '@/components/integrations/WorkoutPlanComparison';

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
  const integrationsEnabled = useIntegrationsEnabled();

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...rest}>
      {integrationsEnabled && isOwn && workout.status === 'finished' && (
        <>
          <WorkoutPlanComparison workoutId={workout.id} />
          <WorkoutFeedback workoutId={workout.id} />
        </>
      )}
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
