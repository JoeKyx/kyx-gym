'use client';
import { FC } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import DashboardLink from '@/components/links/DashboardLink';

const StatsButton: FC = () => {
  const socialContext = useSocial();
  const username = socialContext?.userProfile?.username;
  return (
    <DashboardLink
      text='Stats'
      image='/images/dashboard/stats.jpeg'
      href={`/dashboard/profile/${username}/stats`}
    />
  );
};

export default StatsButton;
