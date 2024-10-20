'use client';
import { Trash2Icon, UserPlus } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import IconButton from '@/components/buttons/IconButton';
import { UserProfile, useSocial } from '@/components/context/SocialContext';
import AvatarDisplay from '@/components/dashboard/AvatarDisplay';

type FriendRequestContainerProps = {
  friend: UserProfile;
};

const FriendContainer: FC<FriendRequestContainerProps> = ({ friend }) => {
  const socialContext = useSocial();

  const [hydrated, setHydrated] = useState(false);

  const [_isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleAcceptFriendRequest = async () => {
    const response = await socialContext?.acceptFriendRequest(friend.userid);
    if (!response?.success) {
      setIsError(true);
    }
  };

  const handleDeclineFriendRequest = async () => {
    const response = await socialContext?.declineFriendRequest(friend.userid);
    if (!response?.success) {
      setIsError(true);
    }
  };

  if (!hydrated) {
    return <></>;
  }

  return (
    <div className='border-primary-500 hover:bg-primary-200 flex w-full  items-center gap-4 border-t px-3 py-2 transition-colors duration-200 ease-in-out'>
      <AvatarDisplay
        imageUrl={
          friend.profile_icons
            ? `/images/avatars/${friend.profile_icons.path}`
            : '/images/avatars/default.jpeg'
        }
        alt={`Avatar of ${friend.username}`}
      />
      <div className='flex flex-grow items-center justify-between'>
        <div className='flex flex-col'>
          <span>{friend.username}</span>
          <span className='text-xs'>Level {friend.level}</span>
        </div>
        <div className='flex gap-2'>
          <IconButton
            icon={UserPlus}
            variant='success'
            onClick={handleAcceptFriendRequest}
          />
          <IconButton
            icon={Trash2Icon}
            variant='danger'
            onClick={handleDeclineFriendRequest}
          />
        </div>
      </div>
    </div>
  );
};

export default FriendContainer;
