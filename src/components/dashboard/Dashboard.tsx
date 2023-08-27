import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import ChallengesButton from '@/components/dashboard/ChallengesButton';
import FriendsArea from '@/components/dashboard/friends/FriendsArea';
import YourProfileButton from '@/components/dashboard/NewProfileButton';
import NewWorkoutButton from '@/components/dashboard/NewWorkoutButton';
import WorkoutFromTemplateButton from '@/components/dashboard/WorkoutFromTemplateButton';

type DashboardProps = HTMLAttributes<HTMLDivElement>;

const Dashboard: FC<DashboardProps> = forwardRef<
  HTMLDivElement,
  DashboardProps
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <div className={className} ref={ref} {...rest}>
      <div className='grid grid-cols-2 justify-items-center gap-4 md:flex md:w-2/3 md:flex-row'>
        <NewWorkoutButton />
        <WorkoutFromTemplateButton />

        <YourProfileButton />
        <ChallengesButton />
      </div>
      <FriendsArea className='flex h-full flex-col rounded-md border-white bg-white opacity-75 shadow-lg md:w-1/3' />
    </div>
  );
});

export default Dashboard;
