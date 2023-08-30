import { CheckSquare, Square } from 'lucide-react';
import { FC, useMemo } from 'react';

import logger from '@/lib/logger';

import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import TypeDisplay from '@/components/dashboard/workout/active/TypeDisplay';
import RecordFlame from '@/components/dashboard/workout/RecordFlame';

import { DBSet, Set, WorkoutItem } from '@/types/Workout';

interface ActiveWorkoutSetRowProps {
  set: Set;
  setIndex: number;
  inputValues: {
    [key: string]: {
      weight?: number;
      reps?: number;
      speed?: number;
      distance?: number;
    };
  };
  handleInputChange: (
    set: DBSet,
    field: 'weight' | 'reps' | 'speed' | 'distance',
    value: string
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
        <span className='text-primary-500 hidden font-semibold md:block'>
          {setIndex + 1}
        </span>

        <TypeDisplay
          className='block md:hidden'
          locked={false}
          set={set}
          onSetChange={(newType) => handleSetTypeChange(set, newType)}
        />
        {workoutItem.exercises?.type === 'weight' && (
          <>
            <input
              type='text' // Change to text input
              inputMode='numeric' // Optimize keyboard for mobile devices
              placeholder='KG'
              value={inputValues[set.id]?.weight || ''}
              onChange={(e) => {
                logger(e.target.value, 'e.target.value');
                // Replace commas with dots, then filter the value for valid decimal inputs
                let value = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '');
                logger(value, 'value');
                // Only allow one dot
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = `${value.substring(0, dotIndex + 1)}${value
                    .substring(dotIndex + 1)
                    .replace(/\./g, '')}`;
                }
                handleInputChange(set, 'weight', value);
              }}
              className='focus:border-primary-600 disabled:bg-primary-200 w-14 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
              disabled={set.is_finished}
            />
            <input
              type='text' // Change to text input
              inputMode='numeric' // Optimize keyboard for mobile devices
              // Allow only digits
              placeholder='Reps'
              value={inputValues[set.id]?.reps || ''}
              onChange={(e) => {
                // Replace commas with dots, then filter the value for valid decimal inputs
                let value = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '');
                // Only allow one dot
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = `${value.substring(0, dotIndex + 1)}${value
                    .substring(dotIndex + 1)
                    .replace(/\./g, '')}`;
                }
                handleInputChange(set, 'reps', value);
              }}
              className='focus:border-primary disabled:bg-primary-200 w-14 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
              disabled={set.is_finished}
            />
          </>
        )}
        {workoutItem.exercises?.type === 'speed' && (
          <>
            <input
              type='text' // Change to text input
              inputMode='numeric' // Optimize keyboard for mobile devices
              // Allow only digits
              placeholder='Minutes'
              value={inputValues[set.id]?.speed || ''}
              onChange={(e) => {
                // Replace commas with dots, then filter the value for valid decimal inputs
                let value = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '');
                // Only allow one dot
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = `${value.substring(0, dotIndex + 1)}${value
                    .substring(dotIndex + 1)
                    .replace(/\./g, '')}`;
                }
                handleInputChange(set, 'speed', value);
              }}
              className='focus:border-primary-600 disabled:bg-primary-200 w-14 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
              disabled={set.is_finished}
            />
            <input
              type='text' // Change to text input
              inputMode='numeric' // Optimize keyboard for mobile devices
              // Allow only digits
              placeholder='Kilometers'
              value={inputValues[set.id]?.distance || ''}
              onChange={(e) => {
                // Replace commas with dots, then filter the value for valid decimal inputs
                let value = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '');
                // Only allow one dot
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = `${value.substring(0, dotIndex + 1)}${value
                    .substring(dotIndex + 1)
                    .replace(/\./g, '')}`;
                }
                handleInputChange(set, 'distance', value);
              }}
              className='focus:border-primary disabled:bg-primary-200 w-14 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
              disabled={set.is_finished}
            />
          </>
        )}
        {workoutItem.exercises?.type === 'other' && (
          <>
            <input
              type='text' // Change to text input
              inputMode='numeric' // Optimize keyboard for mobile devices
              // Allow only digits
              placeholder='Reps'
              value={inputValues[set.id]?.reps || ''}
              onChange={(e) => {
                // Replace commas with dots, then filter the value for valid decimal inputs
                let value = e.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9.]/g, '');
                // Only allow one dot
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = `${value.substring(0, dotIndex + 1)}${value
                    .substring(dotIndex + 1)
                    .replace(/\./g, '')}`;
                }
                handleInputChange(set, 'reps', value);
              }}
              className='focus:border-primary-600 disabled:bg-primary-200 w-14 rounded border p-2 transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 md:w-24'
              disabled={set.is_finished}
            />
          </>
        )}

        <TypeDisplay
          className='hidden md:block'
          locked={false}
          set={set}
          onSetChange={(newType) => handleSetTypeChange(set, newType)}
        />

        <div className='flex w-14 items-center'>
          {set.previous_set &&
            workoutItem.exercises?.type === 'weight' &&
            set.previous_set.id != set.id && (
              <span className='text-start text-xs text-gray-500'>
                {set.previous_set.weight} KG x {set.previous_set.reps}
              </span>
            )}
          <RecordFlame
            isWeight={isHighestInWeight()}
            isVolume={isHighestInVolume()}
            mode='active'
          />
        </div>
      </div>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center'>
          {set.is_finished ? (
            <CheckSquare
              className='text-primary-500 cursor-pointer'
              onClick={() => handleSetFinish(set)}
              size={25}
            />
          ) : (
            <Square
              className='text-primary-500 cursor-pointer'
              onClick={() => handleSetFinish(set)}
              size={25}
            />
          )}
        </div>
        <div
          className='flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-black bg-red-600 p-2 text-white'
          onClick={() => activeWorkoutContext.deleteSet(set.id)}
        >
          <span>X</span>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkoutSetRow;
