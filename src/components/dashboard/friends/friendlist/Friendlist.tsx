'use client';
import { FC, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import FriendContainer from '@/components/dashboard/friends/friendlist/FriendContainer';

type FrienListProps = HTMLAttributes<HTMLDivElement>;

const Friendlist: FC<FrienListProps> = forwardRef<
  HTMLDivElement,
  FrienListProps
>(({ className, ...props }, ref) => {
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const socialContext = useSocial();
  const friendlist = socialContext?.friendlist;

  if (!friendlist || friendlist.length == 0 || !hydrated) {
    return (
      <div
        className='flex-1 items-center justify-center p-5 text-center'
        ref={ref}
        {...props}
      >
        Your friend list is empty
      </div>
    );
  }

  return (
    <div className={className} ref={ref} {...props}>
      {friendlist.map((friend) => {
        return <FriendContainer key={friend.userid} friend={friend} />;
      })}
    </div>
  );
});

Friendlist.displayName = 'Friendlist';

export default Friendlist;
