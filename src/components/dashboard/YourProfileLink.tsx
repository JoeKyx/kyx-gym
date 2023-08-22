'use client';
import { FC, useContext } from 'react';

import { AuthContext } from '@/components/context/AuthContext';
import DashboardLink from '@/components/links/DashboardLink';

interface YourProfileLinkProps {
  className?: string;
}

const YourProfileLink: FC<YourProfileLinkProps> = ({ className }) => {
  const authContext = useContext(AuthContext);

  const username = authContext?.username;

  if (!username) return <></>;

  return (
    <DashboardLink
      text='Your Profile'
      className={className}
      image='/images/dashboard/newWorkout.jpeg'
      href={`/dashboard/profile/${username}`}
    />
  );
};

export default YourProfileLink;
