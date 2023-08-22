'use client';
import { startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import { useProfile } from '@/components/context/ProfileContext';
import { useSocial } from '@/components/context/SocialContext';
import { Calendar } from '@/components/ui/Calendar';

import { DBCalendar, DBWorkout } from '@/types/Workout';

type GymCalendarProps = HTMLAttributes<HTMLDivElement>;

const GymCalendar: FC<GymCalendarProps> = forwardRef<
  HTMLDivElement,
  GymCalendarProps
>((props, ref) => {
  const { className, ...rest } = props;

  const [clickedOnDate, setClickedOnDate] = useState<Date | null>(null);
  const [filteredWorkouts, setFilteredWorkouts] = useState<DBWorkout[]>([]);

  const profileContext = useProfile();
  const router = useRouter();
  const socialContext = useSocial();

  const isOwn =
    profileContext.userProfile?.userid === socialContext?.userProfile?.userid;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {}; // No-operation function

  const planNewWorkout = async (date: Date) => {
    await profileContext.planWorkout(date);
  };

  const [previousWorkoutDates, setPreviousWorkoutDates] = useState<Date[]>([]);
  const [plannedWorkoutDates, setPlannedWorkoutDates] = useState<Date[]>([]);
  const [previousWorkouts, setPreviousWorkouts] = useState<DBWorkout[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<DBCalendar[]>([]);

  useEffect(() => {
    logger(profileContext.plannedWorkouts, 'Profile Context Planned Workouts');
    if (profileContext.plannedWorkouts.length > 0) {
      setPlannedWorkouts(profileContext.plannedWorkouts);
      setPlannedWorkoutDates(
        profileContext.plannedWorkouts.map((workout) => new Date(workout.date))
      );
    }
  }, [profileContext.plannedWorkouts]);

  useEffect(() => {
    logger(profileContext.workouts, 'Profile Context Workouts');
    if (profileContext.workouts.length > 0) {
      setPreviousWorkouts(profileContext.workouts);
      setPreviousWorkoutDates(
        profileContext.workouts.map((workout) => new Date(workout.created_at))
      );
    }
  }, [profileContext.workouts]);

  const CalendarAction: FC<{ date: Date | null }> = ({ date }) => {
    const dateSpan = (
      <span className='font-semibold'>
        {date ? date.toLocaleDateString() : 'Select a date'}
      </span>
    );
    let otherSpan = <span className='font-semibold'>No Workout</span>;
    let bgColor = 'bg-white';

    let onClickFunction = noop;
    if (!date) {
      otherSpan = <span className='font-semibold'></span>;
    } else if (filteredWorkouts.length > 0) {
      onClickFunction = () =>
        router.push(
          `/dashboard/profile/${profileContext.userProfile.username}/history/${filteredWorkouts[0].id}`
        );
      bgColor = 'bg-primary-500';
      otherSpan = (
        <span className='font-semibold'>
          <span className='italic'>{filteredWorkouts[0].name}</span>
        </span>
      );
    } else if (date >= startOfDay(new Date())) {
      const plannedWorkout = plannedWorkouts.find(
        (workout) =>
          new Date(workout.date).toDateString() === date.toDateString()
      );
      if (plannedWorkout && isOwn) {
        onClickFunction = () =>
          profileContext.removeCalendarEntry(plannedWorkout.id);
        bgColor = 'bg-yellow-500';
        otherSpan = <span className='font-semibold'>Remove Plan</span>;
      } else if (plannedWorkout && !isOwn) {
        bgColor = 'bg-yellow-500';
        otherSpan = <span className='font-semibold'>Planned</span>;
      } else {
        if (!isOwn) {
          otherSpan = <span className='font-semibold'>Nothing Planned</span>;
          bgColor = 'bg-white';
        } else {
          onClickFunction = () => planNewWorkout(date);

          otherSpan = <span className='font-semibold'>Plan Workout</span>;
        }
      }
    }
    return (
      <div
        className={cn(
          'mt-4 flex cursor-pointer justify-between rounded-lg p-4 shadow-md transition-all duration-200 ease-in-out',
          filteredWorkouts.length > 0 ? ' text-white ' : 'bg-white',
          bgColor
        )}
        onClick={onClickFunction}
      >
        {dateSpan}
        {otherSpan}
      </div>
    );
  };
  const modifiers = {
    workoutDates: previousWorkoutDates,
    plannedWorkouts: plannedWorkoutDates,
  };

  return (
    <div className={className} ref={ref} {...rest}>
      <Calendar
        className='items-center justify-center px-20 md:px-0'
        weekStartsOn={1}
        modifiers={modifiers}
        onDayClick={(date) => {
          setClickedOnDate(date);
          setFilteredWorkouts(
            previousWorkouts.filter(
              (workout) =>
                new Date(workout.created_at).toDateString() ===
                date.toDateString()
            )
          );
        }}
        modifiersStyles={{
          workoutDates: {
            backgroundColor: '#14b8a6', // Equivalent to bg-green-500
            color: 'white', // Equivalent to text-white
          },
          plannedWorkouts: {
            backgroundColor: '#f59e0b', // Equivalent to bg-yellow-500
            color: 'white', // Equivalent to text-white
          },
        }}
      />
      <CalendarAction date={clickedOnDate} />
    </div>
  );
});

export default GymCalendar;
