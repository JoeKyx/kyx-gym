'use client';
import { MinusCircle, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';

import IconButton from '@/components/buttons/IconButton';
import { UserProfile, useSocial } from '@/components/context/SocialContext';
import AvatarDisplay from '@/components/dashboard/AvatarDisplay';

type FriendContainerProps = {
  friend: UserProfile;
};

const FriendContainer: FC<FriendContainerProps> = ({ friend }) => {
  const socialContext = useSocial();

  const [hydrated, setHydrated] = useState(false);

  const [_isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function removeFriendship(): Promise<void> {
    if (!socialContext) return;
    const removeFriendResponse = await socialContext?.removeFriend(
      friend.userid
    );
    if (!removeFriendResponse.success) {
      setIsError(true);
      return;
    }
    setIsError(false);
  }

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
          <Link href={`/dashboard/profile/${friend.username}`}>
            <IconButton icon={UserCircle2} variant='primary' />
          </Link>
          <IconButton
            icon={MinusCircle}
            variant='danger'
            onClick={removeFriendship}
          />
        </div>
      </div>
    </div>
  );
};

export default FriendContainer;
