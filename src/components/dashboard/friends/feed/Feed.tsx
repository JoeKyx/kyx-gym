'use client';
import { FC, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import FeedItemContainer from '@/components/dashboard/friends/feed/FeedItemContainer';

type FeedProps = HTMLAttributes<HTMLDivElement>;

const Feed: FC<FeedProps> = forwardRef<HTMLDivElement, FeedProps>(
  ({ className, ...props }, ref) => {
    const [hydrated, setHydrated] = useState(false);

    const socialContext = useSocial();

    useEffect(() => {
      setHydrated(true);
    }, []);

    if (
      !hydrated ||
      !socialContext ||
      !socialContext.feed ||
      !socialContext.friendlist
    ) {
      return <></>;
    }

    if (socialContext.friendlist.length == 0) {
      return (
        <div className='flex items-center justify-center p-5' ref={ref}>
          Your friend list is empty
        </div>
      );
    }

    if (socialContext.feed.length === 0) {
      return (
        <div className='flex items-center justify-center p-5' ref={ref}>
          There are no feed items to show
        </div>
      );
    }

    return (
      <div className={className} ref={ref} {...props}>
        {socialContext.feed.map((item) => {
          return <FeedItemContainer key={item.id} feedItem={item} />;
        })}
      </div>
    );
  }
);

export default Feed;
