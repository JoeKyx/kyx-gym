import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import ChallengesButton from '@/components/dashboard/ChallengesButton';
import FriendsArea from '@/components/dashboard/friends/FriendsArea';
import YourProfileButton from '@/components/dashboard/NewProfileButton';
import NewWorkoutButton from '@/components/dashboard/NewWorkoutButton';
import StatsButton from '@/components/dashboard/StatsButton';
import WorkoutFromTemplateButton from '@/components/dashboard/WorkoutFromTemplateButton';

type DashboardProps = HTMLAttributes<HTMLDivElement>;

const Dashboard: FC<DashboardProps> = forwardRef<
  HTMLDivElement,
  DashboardProps
>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <div className={className} ref={ref} {...rest}>
      <div className='flex w-2/3 flex-wrap content-start items-start justify-start gap-2'>
        <NewWorkoutButton />
        <WorkoutFromTemplateButton />
        <YourProfileButton />
        <ChallengesButton />
        <StatsButton />
      </div>
      <FriendsArea className='flex h-full flex-col rounded-md border-white bg-white opacity-75 shadow-lg md:w-1/3' />
    </div>
  );
});

export default Dashboard;
