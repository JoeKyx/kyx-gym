'use client';
import * as Tabs from '@radix-ui/react-tabs';
import { FC, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { useSocial } from '@/components/context/SocialContext';
import Feed from '@/components/dashboard/friends/feed/Feed';
import AddAFriend from '@/components/dashboard/friends/friendlist/AddAFriend';
import Friendlist from '@/components/dashboard/friends/friendlist/Friendlist';
import FriendRequests from '@/components/dashboard/friends/friendRequests/FriendRequests';
import Title from '@/components/text/Title';

type FriendsAreaProps = HTMLAttributes<HTMLDivElement>;

const FriendsArea: FC<FriendsAreaProps> = forwardRef<
  HTMLDivElement,
  FriendsAreaProps
>(({ className }, ref) => {
  const triggerClass =
    'hover:text-primary-300 transition-all duration-300 flex align-center w-full justify-center h-8 text-primary-500 radix-state-active:text-primary-800 radix-state-active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.6)]';

  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('friendlist');
  const socialContext = useSocial();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (socialContext?.friendRequests?.length === 0) {
      setActiveTab('friendlist');
    }
  }, [socialContext?.friendRequests]);

  if (!socialContext || !hydrated) {
    return <></>;
  }

  // get friend requests from context
  const friendRequests = socialContext.friendRequests;
  const friendlist = socialContext.friendlist;

  return (
    <Tabs.Root
      className={className}
      ref={ref}
      defaultValue='friendlist'
      value={activeTab}
    >
      <Tabs.List className='flex h-10 items-start justify-evenly gap-5 pt-2'>
        <Tabs.Trigger
          value='friendlist'
          className={triggerClass}
          onClick={() => setActiveTab('friendlist')}
        >
          Friend List {socialContext.userProfile?.username}
        </Tabs.Trigger>
        <Tabs.Trigger
          value='feed'
          className={triggerClass}
          onClick={() => setActiveTab('feed')}
        >
          Feed
        </Tabs.Trigger>
        {friendRequests && friendRequests.length > 0 && (
          <Tabs.Trigger
            value='friendrequests'
            className={cn(triggerClass, 'text-sm')}
            onClick={() => setActiveTab('friendrequests')}
          >
            {friendRequests.length} Friend{' '}
            {friendRequests.length === 1 ? 'Request' : 'Requests'}
          </Tabs.Trigger>
        )}
      </Tabs.List>
      <Tabs.Content
        value='feed'
        className='radix-state-active:h-full flex max-h-screen flex-col overflow-hidden md:max-h-full'
      >
        <div className='overflow-auto '>
          <Title>Feed</Title>
          <Feed />
        </div>
      </Tabs.Content>
      <Tabs.Content
        value='friendlist'
        className='radix-state-active:h-full flex max-h-screen flex-col overflow-hidden md:max-h-full'
      >
        <div className='flex-grow overflow-auto'>
          <Title>Friend List</Title>
          {friendlist && <Friendlist />}
        </div>
        <div className='mt-auto'>
          <AddAFriend />
        </div>
      </Tabs.Content>
      {friendRequests && friendRequests.length > 0 && (
        <Tabs.Content
          value='friendrequests'
          className='radix-state-active:h-full flex max-h-screen flex-col overflow-hidden md:max-h-full'
        >
          <Title>Friend Requests</Title>
          <FriendRequests />
        </Tabs.Content>
      )}
    </Tabs.Root>
  );
});

export default FriendsArea;
