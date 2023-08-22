'use client';
import { FC } from 'react';

import { useSocial } from '@/components/context/SocialContext';

interface UsernameProps {
  className?: string;
}

const Username: FC<UsernameProps> = ({ className }) => {
  const socialContext = useSocial();
  return (
    <span className={className}>{socialContext?.userProfile?.username}</span>
  );
};
export default Username;
