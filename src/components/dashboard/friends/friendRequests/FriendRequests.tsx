'use client';
import { FC, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import FriendRequestContainer from '@/components/dashboard/friends/friendRequests/FriendRequestContainer';

type FriendRequestsProps = HTMLAttributes<HTMLDivElement>;

const FriendRequests: FC<FriendRequestsProps> = forwardRef<
  HTMLDivElement,
  FriendRequestsProps
>(({ className, ...props }, ref) => {
  const friendRequests = useSocial()?.friendRequests;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <></>;
  }

  if (!friendRequests || friendRequests.length == 0) {
    return (
      <div
        className='items-center justify-center p-5 text-center'
        ref={ref}
        {...props}
      >
        Your don't have any new friend requests
      </div>
    );
  }

  return (
    <div className={className} ref={ref} {...props}>
      {friendRequests.map((friendRequest) => {
        return (
          <FriendRequestContainer
            key={friendRequest.userid}
            friend={friendRequest}
          />
        );
      })}
    </div>
  );
});

FriendRequests.displayName = 'FriendRequests';

export default FriendRequests;
