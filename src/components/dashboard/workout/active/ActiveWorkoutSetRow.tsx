import { CheckSquare, Square } from 'lucide-react';
import { FC, useMemo } from 'react';

import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import TypeDisplay from '@/components/dashboard/workout/active/TypeDisplay';
import RecordFlame from '@/components/dashboard/workout/RecordFlame';

import { DBSet, Set, WorkoutItem } from '@/types/Workout';

interface ActiveWorkoutSetRowProps {
  set: Set;
  setIndex: number;
  inputValues: { [key: string]: { weight?: number; reps?: number } };
  handleInputChange: (
    set: DBSet,
    field: 'weight' | 'reps',
    value: number
  ) => void;
  handleSetTypeChange: (set: DBSet, type: DBSet['type']) => void;
  handleSetFinish: (set: DBSet) => void;
  workoutItem: WorkoutItem;
}

const ActiveWorkoutSetRow: FC<ActiveWorkoutSetRowProps> = ({
  set,
  setIndex,
  inputValues,
  handleInputChange,
  handleSetFinish,
  handleSetTypeChange,
  workoutItem,
}) => {
  const activeWorkoutContext = useActiveWorkout();

  const records = useMemo(
    () =>
      activeWorkoutContext.records.filter(
        (record) => record.exercise_id === workoutItem.exerciseid
      ),
    [activeWorkoutContext.records, workoutItem.exerciseid]
  );

  const weightRecord = records.find((record) => record.type === 'weight');
  const volumeRecord = records.find((record) => record.type === 'volume');

  const isHigherThanRecord = (field: 'weight' | 'volume'): boolean => {
    if (!set.is_finished) return false;
    if (field === 'weight') {
      if (weightRecord?.set_id === set.id) return true;
      return (set.weight || 0) > (weightRecord?.sets?.weight || 0);
    } else {
      if (volumeRecord?.set_id === set.id) return true;
      return (
        (set.weight || 0) * (set.reps || 0) >
        (volumeRecord?.sets?.reps || 0) * (volumeRecord?.sets?.weight || 0)
      );
    }
  };

  const isHighestInWorkoutItem = (field: 'weight' | 'volume'): boolean => {
    if (!set.is_finished) return false;
    if (field === 'weight') {
      // Get the max weight set in the workout item with the lowest finished_at Date (if not exists then lowest id) and that has is_finished = true
      const maxWeightSet = workoutItem.sets
        .filter((item) => item.is_finished)
        .reduce((prev, current) => {
          if (prev.is_finished !== true || !prev.weight || !prev.reps)
            return current;
          if (current.is_finished !== true || !current.weight || !current.reps)
            return prev;

          if (prev.weight > current.weight) return prev;
          if (prev.weight < current.weight) return current;

          // If volumes are equal, compare finished_at
          if (prev.finished_at && current.finished_at) {
            return prev.finished_at < current.finished_at ? prev : current;
          }

          // If one of them doesn't have finished_at, compare by ID
          if (!prev.finished_at || !current.finished_at) {
            return prev.id < current.id ? prev : current;
          }

          return prev; // Fallback
        });
      return set.id === maxWeightSet.id;
    } else {
      // Get the max volume set in the workout item with the lowest id and that has is_finished = true
      const maxVolumeSet = workoutItem.sets.reduce((prev, current) => {
        if (prev.is_finished !== true || !prev.weight || !prev.reps)
          return current;
        if (current.is_finished !== true || !current.weight || !current.reps)
          return prev;

        const prevVolume = prev.weight * prev.reps;
        const currentVolume = current.weight * current.reps;

        if (prevVolume > currentVolume) return prev;
        if (prevVolume < currentVolume) return current;

        // If volumes are equal, compare finished_at
        if (prev.finished_at && current.finished_at) {
          return prev.finished_at < current.finished_at ? prev : current;
        }

        // If one of them doesn't have finished_at, compare by ID
        if (!prev.finished_at || !current.finished_at) {
          return prev.id < current.id ? prev : current;
        }

        return prev; // Fallback
      });
      return set.id === maxVolumeSet.id;
    }
  };

  const isHighestInWeight = (): boolean => {
    return isHighestInWorkoutItem('weight') && isHigherThanRecord('weight');
  };

  const isHighestInVolume = (): boolean => {
    return isHighestInWorkoutItem('volume') && isHigherThanRecord('volume');
  };

  return (
    <div className='mt-2 flex items-center justify-between gap-5'>
      <div className='flex items-center gap-3'>
        <span className='text-primary-500 font-semibold'>{setIndex + 1}</span>
        <input
          type='text' // Change to text input
          inputMode='numeric' // Optimize keyboard for mobile devices
          pattern='[0-9]*' // Allow only digits
          placeholder='Weight'
          value={inputValues[set.id]?.weight || set.weight || ''}
          onChange={(e) => {
            // Filter the value to include only digits
            const value = e.target.value.replace(/[^0-9]/g, '');
            handleInputChange(set, 'weight', Number(value));
          }}
          className='focus:border-primary-600 disabled:bg-primary-200 w-16 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
          disabled={set.is_finished}
        />
        <input
          type='text' // Change to text input
          inputMode='numeric' // Optimize keyboard for mobile devices
          pattern='[0-9]*' // Allow only digits
          placeholder='Reps'
          value={inputValues[set.id]?.reps || set.reps || ''}
          onChange={(e) => {
            // Filter the value to include only digits
            const value = e.target.value.replace(/[^0-9]/g, '');
            handleInputChange(set, 'reps', Number(value));
          }}
          className='focus:border-primary disabled:bg-primary-200 w-16 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
          disabled={set.is_finished}
        />

        <TypeDisplay
          locked={false}
          set={set}
          onSetChange={(newType) => handleSetTypeChange(set, newType)}
        />
        <div
          className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border border-black bg-red-600 p-2 text-white'
          onClick={() => activeWorkoutContext.deleteSet(set.id)}
        >
          <span>X</span>
        </div>

        <div className='flex items-end justify-end'>
          {set.previous_set && (
            <span className='text-end text-xs text-gray-500'>
              {set.previous_set.weight} KG x {set.previous_set.reps}
            </span>
          )}
        </div>
        <div className='items-center md:flex'>
          <RecordFlame
            isWeight={isHighestInWeight()}
            isVolume={isHighestInVolume()}
            mode='active'
          />
        </div>
      </div>

      <div className='flex items-center'>
        {set.is_finished ? (
          <CheckSquare
            className='text-primary-500 cursor-pointer'
            onClick={() => handleSetFinish(set)}
          />
        ) : (
          <Square
            className='text-primary-500 cursor-pointer'
            onClick={() => handleSetFinish(set)}
          />
        )}
      </div>
    </div>
  );
};

export default ActiveWorkoutSetRow;
