'use client';

import { FC, forwardRef, HTMLAttributes, useEffect } from 'react';

import { useProfile } from '@/components/context/ProfileContext';
import WorkoutContainer from '@/components/dashboard/profile/WorkoutContainer';

type LastWorkoutsProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
};
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import logger from '@/lib/logger';

import Button from '@/components/buttons/Button';
import PathNav from '@/components/navbar/PathNav';
import { WorkoutTip } from '@/components/text/WorkoutTip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

const ITEMS_PER_PAGE = 4; // Number of workouts per page

const LastWorkouts: FC<LastWorkoutsProps> = forwardRef<
  HTMLDivElement,
  LastWorkoutsProps
>(({ className, title, ...props }, ref) => {
  const profileContext = useProfile();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainMuscle, setSelectedMainMuscle] = useState<number | null>(
    -2
  );

  const mainMuscleIds = [
    ...new Set(profileContext.workouts.map((workout) => workout.mainmuscle)),
  ];

  // Filter workouts by title if there's a search query
  const filteredWorkouts = profileContext.workouts.filter(
    (workout) =>
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedMainMuscle === -2 ||
        (workout.mainmuscle ? workout.mainmuscle : -1) === selectedMainMuscle)
  );

  // Paginate workouts
  const lastWorkouts = filteredWorkouts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Total number of pages
  const totalPages = Math.ceil(filteredWorkouts.length / ITEMS_PER_PAGE);

  // If the search query changes and there are fewer total pages than the current page, reset to page 1
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [searchQuery, filteredWorkouts, currentPage, totalPages]);

  useEffect(() => {
    logger(selectedMainMuscle, 'Selected muscle');
  }, [selectedMainMuscle]);

  if (profileContext.userProfile === null) return;
  <div className='items-col h-full w-full items-center justify-center'>
    <Loader2 className='animate-spin' size={64} />
    <WorkoutTip />
  </div>;

  return (
    <div className={className} ref={ref} {...props}>
      {title ? <h1 className='mb-4 text-3xl font-semibold'>{title}</h1> : null}

      <div className='mb-4 flex-col rounded-md border bg-white p-4 shadow-lg'>
        <PathNav
          paths={[
            { name: 'Dashboard', href: '/dashboard' },
            {
              name: `${profileContext.userProfile.username}`,
              href: `/dashboard/profile/${profileContext.userProfile.username}`,
            },
            { name: 'History' },
          ]}
        />
        <div className='mt-4 flex flex-col items-start justify-between gap-2'>
          <span className='text-sm text-gray-400'>
            {profileContext.userProfile.username} has completed{' '}
            {profileContext.workouts.length} Workouts!
          </span>
          <div className='flex w-full items-end justify-between gap-10'>
            <input
              type='text'
              placeholder='Search by name'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='rounded-md'
            />
            <Select
              onValueChange={(value) => {
                setSelectedMainMuscle(parseInt(value, 10));
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Muscle' />
              </SelectTrigger>
              <SelectContent
                position='popper'
                className='SelectContent rounded-md rounded-b-none bg-slate-200'
              >
                <SelectItem value='-2' key={-2}>
                  Show All
                </SelectItem>
                {mainMuscleIds.map((muscleId) => {
                  if (muscleId !== null) {
                    return (
                      <SelectItem value={muscleId.toString()} key={muscleId}>
                        {profileContext.muscleResolver(muscleId)}
                      </SelectItem>
                    );
                  }
                  return null; // return null if muscleId is null so that nothing gets rendered
                })}
              </SelectContent>
            </Select>

            {/* <div className="flex items-end justify-end">
              <Button
                variant={selectedMainMuscle === -2 ? 'outline' : 'ghost'}
                onClick={() => setSelectedMainMuscle(-2)}
              >
                All Muscles
              </Button>
              {mainMuscleIds.map(mainMuscleId => {
                const muscleName = mainMuscleId ? profileContext.muscleResolver(mainMuscleId) : 'No muscle';
                return (
                  <Button
                    key={mainMuscleId}
                    variant={selectedMainMuscle === mainMuscleId ? 'outline' : 'ghost'}
                    onClick={() => setSelectedMainMuscle(mainMuscleId !== null ? mainMuscleId : -1)} // Use -1 for "No muscle"
                  >
                    {muscleName}
                  </Button>
                );
              })}
            </div> */}
          </div>
        </div>
      </div>
      {lastWorkouts.length === 0 ? (
        <p className='text-center text-gray-500'>No workouts yet</p>
      ) : null}
      {lastWorkouts.map((workout) => (
        <WorkoutContainer key={workout.id} workout={workout} />
      ))}
      <div className='flex items-center justify-center gap-10'>
        <Button
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className='flex w-24 justify-center'
        >
          Previous
        </Button>
        <span>
          {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className='flex w-24 justify-center'
        >
          Next
        </Button>
      </div>
    </div>
  );
});

export default LastWorkouts;
