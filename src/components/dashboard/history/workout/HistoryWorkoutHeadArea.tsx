import { formatDuration, formatRelative, intervalToDuration } from 'date-fns';
import { enGB } from 'date-fns/locale';
import _ from 'lodash';
import { Calendar, Check, Dumbbell, Save, Share, Timer } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import { saveAsTemplateToDB, updateWorkoutInDB } from '@/lib/supabase-util';
import { getAllMuscles, totalWeightLifted } from '@/lib/workout-util';

import IconButton from '@/components/buttons/IconButton';
import { UserProfile } from '@/components/context/SocialContext';
import UserDisplay from '@/components/dashboard/UserDisplay';
import WorkoutName from '@/components/dashboard/WorkoutName';
import WorkoutRating from '@/components/dashboard/WorkoutRating';
import PathNav from '@/components/navbar/PathNav';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

import { Workout } from '@/types/Workout';
type HistoryWorkoutHeadAreaProps = HTMLAttributes<HTMLDivElement> & {
  workout: Workout;
  userProfile: UserProfile | null;
  isOwn: boolean;
};

const HistoryWorkoutHeadArea: FC<HistoryWorkoutHeadAreaProps> = forwardRef<
  HTMLDivElement,
  HistoryWorkoutHeadAreaProps
>((props, ref) => {
  const { className, workout, isOwn, userProfile, ...rest } = props;

  const [workoutName, setWorkoutName] = useState(workout.name);
  const [_error, setError] = useState<string | null>(null);
  const [loadingSaveAsTemplate, setLoadingSaveAsTemplate] =
    useState<boolean>(false);
  const [savedTemplate, setSavedTemplate] = useState<boolean>(false);

  const date = new Date(workout.created_at);
  const dateFormatted = formatRelative(date, new Date(), {
    locale: enGB,
  });

  const duration = intervalToDuration({
    start: new Date(workout.created_at),
    end: new Date(workout.finished_at || workout.created_at),
  });
  const durationFormatted = formatDuration(duration);

  const weightLifted = workout.workout_items.reduce((totalWeight, item) => {
    const itemWeight = totalWeightLifted(item.sets);
    return typeof itemWeight === 'number'
      ? totalWeight + itemWeight
      : totalWeight;
  }, 0);

  const usedMuscles = getAllMuscles(workout);

  // Debounce the name change
  const setWorkoutNameDebounced = _.debounce((newName: string) => {
    setWorkoutName(newName);
  }, 500);

  useEffect(() => {
    const updateWorkout = async () => {
      const res = await updateWorkoutInDB({ name: workoutName }, workout.id);
      if (res.error) {
        setError(res.error);
      }
    };
    updateWorkout();
  }, [workout.id, workoutName]);

  const saveAsTemplate = async () => {
    setLoadingSaveAsTemplate(true);
    const template = await saveAsTemplateToDB(
      workout,
      workoutName + ' Template'
    );
    if (template.error) {
      setError(template.error);
    }
    setLoadingSaveAsTemplate(false);
    setSavedTemplate(true);
  };

  return (
    <div
      className={cn('rounded-lg bg-white p-4 shadow-md', className)}
      ref={ref}
      {...rest}
    >
      <PathNav
        paths={[
          { name: 'Dashboard', href: '/dashboard' },
          {
            name: `${userProfile?.username}`,
            href: `/dashboard/profile/${userProfile?.username}`,
          },
          {
            name: `History`,
            href: `/dashboard/profile/${userProfile?.username}/history`,
          },
          { name: workoutName },
        ]}
      />
      <div className='flex flex-row items-start justify-between md:items-center'>
        <div className='flex flex-col gap-2'>
          <WorkoutName
            className='text-primary-600 mb-0 mt-2 cursor-pointer text-2xl font-bold'
            workout={workout}
            isOwnWorkout={isOwn}
            onNewName={(newName) => setWorkoutNameDebounced(newName)}
          />
          <WorkoutRating
            className='md:hidden'
            workout={workout}
            isOwnWorkout={isOwn}
          />
          <p className='font-semibold'>
            Muscles:{' '}
            {usedMuscles.map((item, index) =>
              index === usedMuscles.length - 1 ? item.name : `${item.name}, `
            )}
          </p>
          <div className='flex items-center gap-2'>
            <Calendar />
            <p className='text-sm text-gray-500'>{dateFormatted}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Timer />
            <p className='text-sm text-gray-500'>{durationFormatted}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Dumbbell />
            <p className='text-sm text-gray-500'>
              {weightLifted.toFixed(2)} kg
            </p>
          </div>
        </div>
        {props.userProfile ? (
          <div className='hidden items-center gap-2 md:flex '>
            <span className='font-semibold'>{props.userProfile.username}</span>
            <UserDisplay userProfile={props.userProfile} />
            <span className='font-semibold'>
              Level {props.userProfile.level}
            </span>
          </div>
        ) : null}
        <div className='flex flex-col items-center justify-between gap-2 md:items-end'>
          {props.userProfile ? (
            <div className='flex items-center gap-2 md:hidden'>
              <UserDisplay userProfile={props.userProfile} />
            </div>
          ) : null}
          <WorkoutRating
            className='hidden md:flex'
            workout={workout}
            isOwnWorkout={isOwn}
          />
          <div className='flex items-center justify-center gap-2'>
            {/*  Copy link to clipboard: */}
            <Popover>
              <PopoverTrigger>
                <IconButton
                  icon={Share}
                  className='h-3 w-3 rounded-full md:h-3 md:w-3'
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy link
                </IconButton>
              </PopoverTrigger>
              <PopoverContent>
                <span>Copied to clipboard!</span>
              </PopoverContent>
            </Popover>
            {/* <WhatsappShareButton title='Check out this workout!'
              separator=":: "
              url={window.location.href}  ><WhatsappIcon size={34} round /></WhatsappShareButton>
            <TwitterShareButton
              url={window.location.href}
              title='Check out this workout!'
            >
              <TwitterIcon size={34} round />
            </TwitterShareButton> */}
            {savedTemplate ? (
              <IconButton
                variant='outline'
                className='h-3 w-3 rounded-full'
                icon={Check}
                disabled={true}
              >
                Saved
              </IconButton>
            ) : (
              <IconButton
                variant='outline'
                className='h-3 w-3 rounded-full'
                isLoading={loadingSaveAsTemplate}
                icon={Save}
                onClick={saveAsTemplate}
              >
                Save as Template
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default HistoryWorkoutHeadArea;
