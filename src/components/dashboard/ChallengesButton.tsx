'use client';
import { FC } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import DashboardLink from '@/components/links/DashboardLink';

const ChallengesButton: FC = () => {
  const socialContext = useSocial();
  const username = socialContext?.userProfile?.username;
  return (
    <DashboardLink
      text='Challenges  '
      image='/images/dashboard/challenges.jpeg'
      href={`/dashboard/profile/${username}/challenges`}
    />
  );
};

export default ChallengesButton;
