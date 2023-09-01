import React, { FC, forwardRef, HTMLAttributes } from 'react';

import ProfileIcon from '@/components/dashboard/ProfileIcon';
import Username from '@/components/dashboard/Username';
import ActiveWorkoutNotification from '@/components/navbar/ActiveWorkoutNotification';

type MainNavProps = HTMLAttributes<HTMLDivElement>;

const MainNav: FC<MainNavProps> = forwardRef<HTMLDivElement, MainNavProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={className} ref={ref} {...props}>
        <nav className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <ProfileIcon className='border-primary-500 rounded-full border' />
            <span>
              Welcome <Username className='font-semibold' />!
            </span>
          </div>
          <ActiveWorkoutNotification />
        </nav>
      </div>
    );
  }
);

export default MainNav;
