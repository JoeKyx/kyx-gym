import { FC } from 'react';

import TypeDisplay from '@/components/dashboard/workout/active/TypeDisplay';
import RecordFlame from '@/components/dashboard/workout/RecordFlame';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

import { DBExerciseType, HistorySet } from '@/types/Workout';

type HistoryWorkoutSetProps = {
  set: HistorySet;
  setNr: number;
  exerciseType: DBExerciseType;
};

const HistoryWorkoutSet: FC<HistoryWorkoutSetProps> = ({
  set,
  setNr,
  exerciseType,
}) => {
  const isWeightRecord = () => {
    // Does the records of the set contain a weight record?
    return set.records.some((record) => record.type === 'weight');
  };

  const isVolumeRecord = () => {
    // Does the records of the set contain a volume record?
    return set.records.some((record) => record.type === 'volume');
  };

  const isAnyRecord = () => {
    // Does the records of the set contain any record?
    return set.records.length > 0;
  };

  return (
    <div className='flex flex-row items-start '>
      <span className='text-primary-600 w-16 text-left font-semibold'>
        {setNr}
      </span>
      <span className='w-20 text-left text-sm text-gray-500'>
        {exerciseType === 'speed' ? `${set.speed} min` : `${set.reps} Reps`}
      </span>
      {exerciseType === 'weight' && (
        <span className='w-20 text-left text-sm text-gray-500'>
          {set.weight} kg
        </span>
      )}
      {exerciseType === 'speed' && (
        <span className='w-20 text-left text-sm text-gray-500'>
          {set.distance} km
        </span>
      )}
      <div className='w-6 md:w-16'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TypeDisplay locked={true} set={set} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{set.type} Set</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='w-32'>
        {isAnyRecord() && (
          <RecordFlame
            isVolume={isVolumeRecord()}
            isWeight={isWeightRecord()}
            mode='history'
          />
        )}
      </div>
    </div>
  );
};

export default HistoryWorkoutSet;
