'use client';
import { FC } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import DashboardLink from '@/components/links/DashboardLink';

interface YourProfileButtonProps {
  className?: string;
}

const YourProfileButton: FC<YourProfileButtonProps> = ({ className }) => {
  const socialContext = useSocial();
  return (
    <DashboardLink
      text='Profile'
      image={
        `/images/avatars/${socialContext?.userProfile?.profile_icons?.path}` ||
        '/images/avatars/default.jpeg'
      }
      href={'/dashboard/profile/' + socialContext?.userProfile?.username}
      className={className}
    />
  );
};

export default YourProfileButton;
