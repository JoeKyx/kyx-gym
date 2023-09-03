import _ from 'lodash';
import { HelpCircle, Loader2Icon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import finishedWorkoutSound from 'public/sounds/workout-finished.mp3';
import {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { HTMLAttributes } from 'react';
import React from 'react';

import logger from '@/lib/logger';
import { percentageDone, totalWeightLifted } from '@/lib/workout-util';

import Button from '@/components/buttons/Button';
import IconButton from '@/components/buttons/IconButton';
import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import { useSocial } from '@/components/context/SocialContext';
import ActiveWorkoutSetRow from '@/components/dashboard/workout/active/ActiveWorkoutSetRow';
import DeleteWorkoutModal from '@/components/dashboard/workout/active/DeleteWorkoutModal';
import ProgressBar from '@/components/dashboard/workout/active/ProgressBar';
import TemplateChangedModal from '@/components/dashboard/workout/active/TemplateChangedModal';
import { WorkoutDuration } from '@/components/dashboard/workout/active/WorkoutDuration';
import WorkoutNotFinishedModal from '@/components/dashboard/workout/active/WorkoutNotFinishedModal';
import WorkoutName from '@/components/dashboard/WorkoutName';
import PathNav from '@/components/navbar/PathNav';
import Skeleton from '@/components/Skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

import { DBSet, Set, WorkoutItem } from '@/types/Workout';

type ActiveWorkoutProps = HTMLAttributes<HTMLDivElement>;

const ActiveWorkout: FC<ActiveWorkoutProps> = forwardRef<
  HTMLDivElement,
  ActiveWorkoutProps
>((props, ref) => {
  type InputValue = {
    weight?: number;
    reps?: number;
    distance?: number;
    speed?: number;
  };
  type InputValues = Record<string, InputValue>;

  const { className, ...rest } = props;

  const [inputValues, setInputValues] = useState<InputValues>({});

  const [loadingAddSet, setLoadingAddSet] = useState<Record<number, boolean>>(
    {}
  );

  const [deletingWorkoutLoading, setDeletingWorkoutLoading] =
    useState<boolean>(false);
  const [showHowTo, setShowHowTo] = useState<Record<number, boolean>>({});
  const [showWorkoutNotFinishedModal, setShowWorkoutNotFinishedModal] =
    useState<boolean>(false);
  const [showTemplateChangedModal, setShowTemplateChangedModal] =
    useState<boolean>(false);
  const [showDeleteWorkoutModal, setShowDeleteWorkoutModal] =
    useState<boolean>(false);
  const [finishedWorkoutLoading, setFinishedWorkoutLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const activeWorkoutContext = useActiveWorkout();
  const workout = activeWorkoutContext.activeWorkout;

  useEffect(() => {
    if (workout) {
      setInputValues((prevInputValues) => {
        const newInputValues: InputValues = {};
        workout.workout_items.forEach((item) => {
          item.sets.forEach((set) => {
            newInputValues[set.id] = {
              weight:
                prevInputValues[set.id]?.weight ??
                (set.weight !== null ? set.weight : undefined),
              reps:
                prevInputValues[set.id]?.reps ??
                (set.reps !== null ? set.reps : undefined),
              distance:
                prevInputValues[set.id]?.distance ??
                (set.distance !== null ? set.distance : undefined),
              speed:
                prevInputValues[set.id]?.speed ??
                (set.speed !== null ? set.speed : undefined),
            };
          });
        });
        return newInputValues;
      });
    }
  }, [workout]);

  const socialContext = useSocial();

  const playSound = (soundUrl: string) => {
    const audio = new Audio(soundUrl);
    audio.play();
  };

  const allSetsFinished = (sets: DBSet[]): boolean => {
    return sets.every((set) => set.is_finished);
  };

  const allSetsInWorkoutFinished = (): boolean => {
    if (!workout) return false;
    return workout.workout_items.every((item) => allSetsFinished(item.sets));
  };

  const debouncedUpdateWorkoutName = useMemo(
    () => _.debounce(activeWorkoutContext.updateWorkoutName, 5000),
    [activeWorkoutContext.updateWorkoutName]
  );

  const handleWorkoutNameChange = useCallback(
    (name: string) => {
      if (!workout || name.length === 0) return;
      debouncedUpdateWorkoutName(name);
    },
    [debouncedUpdateWorkoutName, workout]
  ); // Add other dependencies if necessary

  const handleInputChange = (
    set: Set,
    field: 'weight' | 'reps' | 'speed' | 'distance',
    value: string
  ) => {
    const newValues = { ...inputValues[set.id], [field]: value };
    setInputValues({ ...inputValues, [set.id]: newValues });
  };

  const handleSetFinish = (set: Set) => {
    const weight = inputValues[set.id]?.weight ?? null;
    const reps = inputValues[set.id]?.reps ?? null;
    const speed = inputValues[set.id]?.speed ?? null;
    const distance = inputValues[set.id]?.distance ?? null;
    set.weight = weight !== undefined ? weight : null;
    set.reps = reps !== undefined ? reps : null;
    set.speed = speed !== undefined ? speed : null;
    set.distance = distance !== undefined ? distance : null;
    set.is_finished = !set.is_finished;
    // TODO: Play sound
    activeWorkoutContext.updateSet(set);
  };

  const handleSetTypeChange = (set: Set, type: Set['type']) => {
    // Update locally
    const newSet = { ...set, type };
    activeWorkoutContext.updateSet(newSet);
  };

  const handleAddSet = async (item: WorkoutItem) => {
    setLoadingAddSet((prev) => ({ ...prev, [item.id]: true }));
    if (socialContext?.userProfile?.userid) {
      await activeWorkoutContext.addSet(item.id);
    }
    setLoadingAddSet((prev) => ({ ...prev, [item.id]: false }));
  };

  const finishWorkout = async () => {
    setShowWorkoutNotFinishedModal(false);
    playSound(finishedWorkoutSound);
    const res = await activeWorkoutContext.finishWorkout();
    if (res.success) {
      setFinishedWorkoutLoading(false);
      router.push(
        `/dashboard/profile/${socialContext?.userProfile?.username}/history/` +
          activeWorkoutContext.activeWorkout?.id
      );
    } else {
      setFinishedWorkoutLoading(false);
      setError(res.message);
    }
  };

  const onUpdateTemplate = async () => {
    setShowTemplateChangedModal(false);
    await activeWorkoutContext.updateTemplate();
    setFinishedWorkoutLoading(true);
    await finishWorkout();
  };

  const handleFinishWorkout = async () => {
    if (!workout) return;
    if (!allSetsInWorkoutFinished()) {
      logger('Not all sets in workout finished');
      setShowWorkoutNotFinishedModal(true);
      return;
    }
    const changedTemplate =
      await activeWorkoutContext.changedWorkoutComparedToTemplate();
    if (changedTemplate) {
      setShowTemplateChangedModal(true);
      return;
    }

    setFinishedWorkoutLoading(true);

    await finishWorkout();
  };

  const onContinueWorkout = () => {
    setShowDeleteWorkoutModal(true);
  };

  const onDeleteWorkout = async () => {
    setDeletingWorkoutLoading(true);
    const delWorkoutContext = await activeWorkoutContext.deleteWorkout();
    if (delWorkoutContext.success) {
      setShowDeleteWorkoutModal(false);
      router.push('/dashboard');
    } else {
      setError(delWorkoutContext.message);
      setDeletingWorkoutLoading(false);
    }
  };

  let totalWeight = 0;
  if (!workout)
    return (
      <div>
        <Loader2Icon className='animate-spin'></Loader2Icon>{' '}
      </div>
    );

  workout.workout_items.forEach((item) => {
    totalWeight += totalWeightLifted(item.sets);
  });

  const percentageOfWorkoutFinished = percentageDone(workout);

  if (!workout) {
    return (
      <div>
        <Loader2Icon className='animate-spin'></Loader2Icon>{' '}
      </div>
    );
  }

  return (
    <div className={className} ref={ref} {...rest}>
      <div className='my-3 rounded-lg bg-white p-4 shadow-md md:my-5 md:p-4'>
        <div className='flex'>
          <div className='flex w-full flex-col'>
            <PathNav
              paths={[
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'Active Workout' },
              ]}
            />
            <WorkoutName
              workout={workout}
              isOwnWorkout={true}
              onNewName={handleWorkoutNameChange}
              className='text-primary-600 mb-0 mt-2'
            />
            <div className='mb-4 flex flex-col items-start'>
              <div className='flex justify-between gap-2 text-gray-600'>
                <span>Running for: </span>
                <WorkoutDuration createdAt={workout.created_at} />
              </div>
              <span>Weight lifted so far: {totalWeight} kg</span>
              {error && <span className='text-red-500'>{error}</span>}
            </div>
          </div>
          <div className='flex w-44 flex-col items-end justify-between gap-4'>
            <Button
              variant='ghost'
              onClick={() => setShowDeleteWorkoutModal(true)}
              isLoading={deletingWorkoutLoading}
            >
              Delete Workout
            </Button>
            <Button
              variant={allSetsInWorkoutFinished() ? 'primary' : 'ghost'}
              onClick={handleFinishWorkout}
              isLoading={finishedWorkoutLoading}
            >
              Finish Workout
            </Button>
          </div>
        </div>

        <ProgressBar percentageDone={percentageOfWorkoutFinished || 0} />
      </div>
      <div className='h-4/6 overflow-auto'>
        {' '}
        {/* Add a specific height or max-height */}
        {workout.workout_items.map((item, index) => (
          <div
            key={index}
            className='mb-4 rounded-lg bg-white p-4 shadow-md md:p-4'
          >
            <div className='flex items-center justify-between'>
              <div className='flex gap-2'>
                <span className='text-primary-500 font-semibold'>
                  {item.exercises?.name}
                  {allSetsFinished(item.sets) && <>{' - Done '}</>}
                </span>
                <div className='md:hidden'>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className='text-primary cursor-pointer' />
                    </PopoverTrigger>
                    <PopoverContent>{item.exercises?.howto}</PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className='flex items-start'>
                <MuscleAndCategory
                  className='hidden gap-3 md:flex'
                  item={item}
                />

                <IconButton
                  icon={X}
                  variant='outline'
                  className='ml-2 hover:bg-red-400 hover:text-white'
                  onClick={() =>
                    activeWorkoutContext.deleteWorkoutItem(item.id)
                  }
                />
              </div>
            </div>
            <div className='flex w-full flex-col md:flex-row'>
              <div className='flex w-full flex-col md:w-1/2'>
                {item.sets
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((set, setIndex) => (
                    <React.Fragment key={setIndex}>
                      <ActiveWorkoutSetRow
                        set={set}
                        setIndex={setIndex}
                        inputValues={inputValues}
                        handleInputChange={handleInputChange}
                        handleSetTypeChange={handleSetTypeChange}
                        handleSetFinish={handleSetFinish}
                        workoutItem={item}
                      />
                    </React.Fragment>
                  ))}
                <div className='mt-4 flex justify-start'>
                  <Button
                    variant='primary'
                    onClick={() => handleAddSet(item)}
                    className='text-center'
                    disabled={loadingAddSet[item.id]} // Disable the button while loading
                  >
                    {loadingAddSet[item.id] ? (
                      <Loader2Icon className='animate-spin' /> // Show loading spinner
                    ) : (
                      'Add Set'
                    )}
                  </Button>
                </div>
              </div>
              <div className='ml-5 mt-2 hidden w-3/5 md:block'>
                <div className='flex h-full flex-col justify-between'>
                  <div className='flex flex-col'>
                    <span className='text-primary font-semibold'>
                      {showHowTo[item.id] ? 'How to' : 'Description'}
                    </span>
                    <span className='shadow-sm'>
                      {showHowTo[item.id]
                        ? item.exercises?.howto
                        : item.exercises?.description}
                    </span>
                  </div>
                  <Button
                    variant='primary'
                    leftIcon={HelpCircle}
                    onClick={() =>
                      setShowHowTo((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    className='mt-auto text-center'
                  >
                    {showHowTo[item.id] ? 'Description' : 'How to'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {[...Array(activeWorkoutContext.loadingExercises)].map((_, i) => (
          <Skeleton key={i} className='h-40 w-full' />
        ))}
      </div>
      <WorkoutNotFinishedModal
        open={showWorkoutNotFinishedModal}
        onCancel={() => setShowWorkoutNotFinishedModal(false)}
        onContinue={finishWorkout}
      />
      <DeleteWorkoutModal
        open={showDeleteWorkoutModal}
        onContinue={onContinueWorkout}
        onDelete={onDeleteWorkout}
      />
      <TemplateChangedModal
        open={showTemplateChangedModal}
        onUpdate={onUpdateTemplate}
        onNoUpdate={() => finishWorkout()}
      />
    </div>
  );
});

type MuscleAndCategoryProps = {
  className?: string;
  item: WorkoutItem;
};

const MuscleAndCategory: React.FC<MuscleAndCategoryProps> = ({
  className,
  item,
}) => {
  return (
    <div className={className}>
      <span className='text-gray-600'>
        {item.exercises?.exercise_categories?.name}
      </span>
      <div>
        {item.exercises?.muscles?.map((muscle, muscleIndex, musclesArray) => (
          <span key={muscleIndex} className='text-gray-600'>
            {muscle.name}
            {muscleIndex < musclesArray.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ActiveWorkout;
