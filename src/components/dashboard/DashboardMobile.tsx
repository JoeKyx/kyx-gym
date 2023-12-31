'use client';
import * as Tabs from '@radix-ui/react-tabs';
import { Dumbbell, User, Users } from 'lucide-react';
import Link from 'next/link';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import logger from '@/lib/logger';
import { hasActiveWorkout } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import FriendsArea from '@/components/dashboard/friends/FriendsArea';
import ProfileTab from '@/components/dashboard/mobile/ProfileTab';
import WorkoutTab from '@/components/dashboard/mobile/WorkoutTab';

type DashboardMobileProps = HTMLAttributes<HTMLDivElement>;
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
const DashboardMobile: FC<DashboardMobileProps> = forwardRef<
  HTMLDivElement,
  DashboardMobileProps
>((props, ref) => {
  const { className, ...rest } = props;
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const socialContext = useSocial();

  function isBeforeInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
    return 'prompt' in e && 'userChoice' in e;
  }

  useEffect(() => {
    const fetchActiveWorkoutId = async () => {
      if (socialContext?.userProfile?.userid === undefined) return;
      const res = await hasActiveWorkout(socialContext.userProfile.userid);
      if (!res.success || !res.data) return;
      setActiveWorkoutId(res.data.id);
    };
    fetchActiveWorkoutId();
  }, [socialContext?.userProfile?.userid]);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    setShowInstallButton(false);
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        logger('User accepted the A2HS prompt');
      } else {
        logger('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    });
  };
  useEffect(() => {
    const handler = (e: Event) => {
      if (isBeforeInstallPromptEvent(e)) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  return (
    <div className={className} ref={ref} {...rest}>
      {showInstallButton && (
        <div
          className='bg-primary-300 hover:bg-primary-500 fixed left-0 top-0 z-50 w-full p-4 text-center text-black hover:text-white'
          onClick={handleInstallClick}
        >
          Click here to install the app!
        </div>
      )}
      {activeWorkoutId && (
        <Link
          className='bg-primary-300 hover:bg-primary-500 fixed left-0 top-0 z-50 w-full p-4 text-center text-black hover:text-white'
          href={`/dashboard/workout/${activeWorkoutId}`}
        >
          Go to current Workout
        </Link>
      )}
      <Tabs.Root
        className='flex h-screen w-full flex-col justify-start'
        defaultValue='profile'
      >
        <Tabs.Content
          className='grow rounded-b-md bg-white p-5 pb-12 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black'
          value='profile'
        >
          <ProfileTab />
        </Tabs.Content>
        <Tabs.Content className='h-full bg-white pb-20' value='social'>
          <FriendsArea className='h-full w-full' />
        </Tabs.Content>
        <Tabs.Content
          className='grow rounded-b-md bg-white p-5 pb-12 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black'
          value='workouts'
        >
          <WorkoutTab />
        </Tabs.Content>
        {/* <Tabs.Content
          className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black pb-12"
          value="test"
        >

          <ProfileTab2 />
        </Tabs.Content> */}
        <Tabs.List
          className='border-primary-400 fixed bottom-0 flex w-full border-b'
          aria-label='Menu'
        >
          <Tabs.Trigger
            className='text-mauve11 hover:text-violet11 data-[state=active]:text-primary-500 flex h-[45px] flex-1 cursor-default select-none items-center justify-center gap-2 bg-white px-5 text-[15px] leading-none outline-none   data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black'
            value='profile'
          >
            <User size={20} />
            <span>Profile</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            className='text-mauve11 hover:text-violet11 data-[state=active]:text-primary-500 flex h-[45px] flex-1 cursor-default select-none items-center justify-center gap-2 bg-white px-5 text-[15px] leading-none outline-none  data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black'
            value='workouts'
          >
            <Dumbbell size={20} />
            <span>Workouts</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            className='text-mauve11 hover:text-violet11 data-[state=active]:text-primary-500 data-[state=active]:focus:shadow-primary-700 flex h-[45px] flex-1 cursor-default select-none items-center justify-center gap-2 bg-white px-5 text-[15px] leading-none outline-none   data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px]'
            value='social'
          >
            <Users size={20} />
            <span>Social</span>
          </Tabs.Trigger>
          {/* <Tabs.Trigger
            className="bg-white gap-2 px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-primary-500 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-primary-700 outline-none cursor-default"
            value="test"
          >
            <Users size={20} /><span>Test</span>
          </Tabs.Trigger> */}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
});

export default DashboardMobile;
