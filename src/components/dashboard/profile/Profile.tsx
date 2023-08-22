'use client';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import GymCalendar from '@/components/dashboard/GymCalendar';
import HistoryChart from '@/components/dashboard/profile/HistoryChart';
import ProfileInfoCard from '@/components/dashboard/profile/ProfileInfoCard';
import SelectProfilePictureModal from '@/components/dashboard/profile/SelectProfilePictureModal';

type ProfileProps = HTMLAttributes<HTMLDivElement>;

const Profile: FC<ProfileProps> = forwardRef<HTMLDivElement, ProfileProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    return (
      <>
        {' '}
        <SelectProfilePictureModal />
        <main
          className={cn('mb-10 flex flex-col md:mb-0', className)}
          ref={ref}
          {...rest}
        >
          <ProfileInfoCard className='rounded-lg bg-white p-4 shadow-md' />
          <div className='flex-col gap-4 md:mx-4 md:flex md:flex-row'>
            <HistoryChart className='mt-4 rounded-lg bg-white p-4 shadow-md' />
            <GymCalendar className='mt-4 flex flex-col rounded-lg bg-white p-4 shadow-md' />
          </div>
        </main>
      </>
    );
  }
);

export default Profile;
