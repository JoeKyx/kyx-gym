import Image from 'next/image';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import AddFriendButton from '@/components/dashboard/friends/AddFriendButton';

import { UserProfile } from '@/types/UserProfile';

type UserDisplayProps = HTMLAttributes<HTMLDivElement> & {
  userProfile: UserProfile;
};

const UserDisplay: FC<UserDisplayProps> = forwardRef<
  HTMLDivElement,
  UserDisplayProps
>((props, ref) => {
  const { className, userProfile, ...rest } = props;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      ref={ref}
      {...rest}
    >
      <Image
        src={
          userProfile.profilepic
            ? userProfile.profilepic
            : '/images/avatars/default.jpeg'
        }
        alt='Profile'
        width={96}
        height={96}
        className='border-primary-300 hover:border-primary-500 mb-4 rounded-full border-2 transition-all duration-300 ease-in-out hover:border-4'
      />
      <AddFriendButton
        userId={userProfile.userid}
        friendName={userProfile.username}
      />
    </div>
  );
});

export default UserDisplay;
