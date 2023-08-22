'use client';
import Image from 'next/image';
import { FC } from 'react';

import { useSocial } from '@/components/context/SocialContext';

type ProfileIconProps = {
  className?: string;
  width?: number;
  height?: number;
};

const ProfileIcon: FC<ProfileIconProps> = ({ className, width, height }) => {
  const socialContext = useSocial();

  return (
    <Image
      src={
        `/images/avatars/${socialContext?.userProfile?.profile_icons?.path}` ||
        '/images/avatars/default_profile_icon.png'
      }
      height={height || 50}
      width={width || 50}
      alt='Profile Icon'
      className={className}
    />
  );
};

export default ProfileIcon;
