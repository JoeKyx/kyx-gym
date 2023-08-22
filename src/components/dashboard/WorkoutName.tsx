import { FC, forwardRef, HTMLAttributes, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

import { DBWorkout, Workout } from '@/types/Workout';

type WorkoutNameProps = HTMLAttributes<HTMLInputElement> & {
  workout: Workout | DBWorkout;
  isOwnWorkout: boolean;
  onNewName: (newName: string) => void;
};

const WorkoutName: FC<WorkoutNameProps> = forwardRef<
  HTMLDivElement,
  WorkoutNameProps
>((props, ref, ...rest) => {
  const { workout, isOwnWorkout, onNewName, className } = props;
  const [workoutName, setWorkoutName] = useState<string>(workout.name);
  const [_isNameEdited, setIsNameEdited] = useState<boolean>(false);
  const [initialWorkoutName, _setInitialWorkoutName] = useState<string>(
    workout.name
  );

  const handleNameChange = useCallback(
    async (newName: string) => {
      if (!isOwnWorkout) return;
      if (workoutName === initialWorkoutName) return;
      onNewName(newName);
    },
    [isOwnWorkout, workoutName, initialWorkoutName, onNewName]
  );

  return isOwnWorkout ? (
    <input
      {...rest}
      type='text'
      className={cn(
        'background-transparent mb-2 w-full border-0 p-0 text-lg font-semibold outline-none',
        className
      )}
      value={workoutName}
      onChange={(e) => {
        setWorkoutName(e.target.value);
        setIsNameEdited(true);
        handleNameChange(e.target.value);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const newName = (e.target as HTMLInputElement).value;
          if (newName !== workoutName) {
            setWorkoutName(newName);
            setIsNameEdited(true);
            handleNameChange(newName);
          }
          (e.target as HTMLElement).blur();
        }
      }}
    />
  ) : (
    <p ref={ref} className={cn('mb-2 text-lg font-semibold', className)}>
      {' '}
      {workout.name}
    </p>
  );
});

export default WorkoutName;
