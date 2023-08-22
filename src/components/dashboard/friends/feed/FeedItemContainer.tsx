'use client';
import moment from 'moment';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import React from 'react';

import { useSocial } from '@/components/context/SocialContext';
import AvatarDisplay from '@/components/dashboard/AvatarDisplay';

import { Database } from '@/types/supabase';

type Feed = Database['public']['Tables']['feedprofile']['Row'];
type UserProfile = Database['public']['Tables']['userprofile']['Row'];

type FeedItemProps = {
  feedItem: Feed;
};

const FeedItemContainer: FC<FeedItemProps> = ({ feedItem }) => {
  const [hydrated, setHydrated] = useState(false);
  const [friend, setFriend] = useState<UserProfile>();
  const socialContext = useSocial();

  useEffect(() => {
    setHydrated(true);
    const friend = socialContext?.friendlist.find(
      (friend) => friend.userid == feedItem.targetuser
    );
    setFriend(friend);
  }, [feedItem.targetuser, feedItem.userid, socialContext?.friendlist]);

  // See whether the friend list of the user contains the user of the FeedItem, if yes get the avatar of the user

  const avatar =
    friend && friend.profilepic
      ? friend.profilepic
      : '/images/avatars/default.jpeg';

  const TextComponent = (): React.ReactNode => {
    if (!feedItem.text) return null;

    // Pattern now includes USER@<alphanumeric> and WORKOUT@<numbers>
    const pattern = /(USER@[\w-]+|WORKOUT@\d+|\s+|\w+|\W+)/g;

    const segments = feedItem.text.match(pattern) || [];

    const textComponent = segments.map((segment, index) => {
      if (segment.startsWith('USER@')) {
        const userId = segment.split('@')[1];
        return (
          <Link
            key={index}
            href={`dashboard/profile/${userId}`}
            className='text-primary-500 px-0.5 hover:underline'
          >
            {friend?.username || '???'}
          </Link>
        );
      } else if (segment.startsWith('WORKOUT@')) {
        const workoutId = segment.split('@')[1];
        return (
          <Link
            key={index}
            href={`dashboard/profile/${friend?.username}/history/${workoutId}`}
            className='text-primary-500 px-0.5 hover:underline'
          >
            Workout
          </Link>
        );
      }
      return segment;
    });

    return <span>{textComponent}</span>;
  };

  const timeAgo = moment(feedItem.date).fromNow();

  if (!hydrated) {
    return <></>;
  }

  return (
    <div className='border-primary-500 hover:bg-primary-200 flex w-full  border-t py-2 transition-colors duration-200 ease-in-out'>
      <AvatarDisplay
        imageUrl={avatar}
        alt={`Avatar of ${friend?.username} || 'a user'`}
        className='mx-3'
      />
      <div className='flex flex-col items-start'>
        <TextComponent />
        <span className='text-xs'>{timeAgo}</span>
      </div>
    </div>
  );
};

export default FeedItemContainer;
