'use client';
import { Flame, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { FC, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import logger from '@/lib/logger';

import { useProfile } from '@/components/context/ProfileContext';
import { useSocial } from '@/components/context/SocialContext';
import AddFriendButton from '@/components/dashboard/friends/AddFriendButton';
import ButtonLink from '@/components/links/ButtonLink';
import PathNav from '@/components/navbar/PathNav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

type ProfileInfoCardProps = HTMLAttributes<HTMLDivElement>;

const ProfileInfoCard: FC<ProfileInfoCardProps> = forwardRef<
  HTMLDivElement,
  ProfileInfoCardProps
>(({ className, ...props }, ref) => {
  const profileContext = useProfile();
  const socialContext = useSocial();

  const [progressPercentage, setProgressPercentage] = useState(0);

  const isOwn =
    socialContext?.userProfile?.userid === profileContext.userProfile?.userid ||
    false;

  const streakColor = () => {
    if (profileContext.currentStreak >= 7) {
      return 'text-yellow-500 fill-red-600';
    } else if (profileContext.currentStreak >= 3) {
      return 'text-yellow-500 fill-red-400';
    } else {
      return 'text-yellow-500 fill-red-200';
    }
  };

  useEffect(() => {
    const experienceNeededForNextLevel = () => {
      // Ensuring userProfile exists and has a defined level.
      const level = profileContext.userProfile?.level;
      if (level === null || level === undefined) return null;

      // Get exp needed for next level from the social context.
      const levelXp = socialContext?.levelXp;
      if (!levelXp) return null;

      // Get the exp needed for the next level.
      const currentLevelXp = levelXp.find(
        (xp) => xp.level === level + 1
      )?.experience;

      return currentLevelXp || null; // Return the experience or null if not found.
    };

    const xpNeeded = experienceNeededForNextLevel();
    logger(xpNeeded, 'xpNeeded');
    if (xpNeeded === null) return;

    const userCurrentExp = profileContext.userProfile?.exp || 0; // Replace with the real value
    const calculatedProgressPercentage = (userCurrentExp / xpNeeded) * 100;
    logger(calculatedProgressPercentage, 'progressPercentage');

    setProgressPercentage(calculatedProgressPercentage);
  }, [
    profileContext.userProfile?.exp,
    profileContext.userProfile?.level,
    socialContext?.levelXp,
  ]);

  return !profileContext?.userProfile ? (
    <Loader2 className='mx-auto' />
  ) : (
    <div ref={ref} className={`${className} flex flex-col`} {...props}>
      {' '}
      {/* <-- Add flex and flex-col here */}
      <PathNav
        paths={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: `${profileContext?.userProfile?.username}` },
        ]}
      />
      <div className='flex w-full flex-row-reverse items-center justify-between md:grid md:grid-cols-3 md:justify-normal'>
        <div className='hidden md:block'></div>
        <div className='flex justify-center'>
          {' '}
          {/* Centered image */}
          <div
            className='relative flex items-center justify-center'
            style={{ width: '117px', height: '117px' }}
          >
            {' '}
            {/* Container to position the image and SVG */}
            {/* Circular progress bar */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {' '}
                  <svg width='100%' height='100%' viewBox='0 0 104 104'>
                    {/* Background Circle */}
                    <circle
                      cx='52'
                      cy='52'
                      r='47'
                      fill='none'
                      stroke='white'
                      strokeWidth='5'
                    />
                    {/* Progress Circle */}

                    <circle
                      cx='52'
                      cy='52'
                      r='47'
                      fill='none'
                      stroke='#14b8a6'
                      strokeWidth='6'
                      strokeDasharray={`${2 * Math.PI * 47}`} // Update according to the new radius
                      strokeDashoffset={`${
                        2 * Math.PI * 47 * (1 - progressPercentage / 100)
                      }`}
                      transform='rotate(-90 52 52)' // Rotate the circle so the progress starts from the top
                      strokeLinecap='round'
                    />
                  </svg>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className='text-center'>
                      Level {profileContext?.userProfile?.level}
                    </p>
                    <p className='text-center'>
                      Experience: {profileContext?.userProfile?.exp}
                    </p>
                    <p className='text-center'>
                      Experience needed for next level:{' '}
                      {
                        socialContext?.levelXp?.find(
                          (xp) =>
                            xp.level === profileContext?.userProfile?.level ||
                            0 + 1
                        )?.experience
                      }
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Profile Image */}
            <Image
              src={
                profileContext?.userProfile?.icon
                  ? `/images/avatars/${profileContext?.userProfile.profile_icons?.path}`
                  : '/images/avatars/default.jpeg'
              }
              alt='Profile'
              width={96}
              height={96}
              className='absolute rounded-full'
            />
            {/* Overlay */}
            {isOwn && (
              <div
                className='absolute inset-2 z-10 flex cursor-pointer items-center justify-center rounded-full bg-black opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-50'
                onClick={() => profileContext.setShowProfilePictureModal(true)}
              >
                <p className='font-semibold text-white'>Change</p>
              </div>
            )}
          </div>
        </div>
        <div className='flex-col-reverse md:mt-4 md:flex md:flex-row md:justify-end'>
          {' '}
          {/* Right button */}
          <div className='flex flex-col md:hidden'>
            <h2 className='text-lg font-semibold'>
              {profileContext?.userProfile.username}
            </h2>
            {profileContext.currentStreak > 0 && (
              <p className='mb-4 flex items-end gap-1 text-sm text-gray-500'>
                Current Streak: {profileContext.currentStreak} days{' '}
                <Flame className={streakColor()} />
              </p>
            )}
          </div>
          <ButtonLink
            className='hidden md:block'
            variant='light'
            href={`/dashboard/profile/${profileContext?.userProfile.username}/history/`}
          >
            See all Workouts
          </ButtonLink>
        </div>
      </div>
      <div className='hidden items-start md:flex  md:flex-grow  md:flex-col md:items-center md:justify-center'>
        {' '}
        {/* <-- And here */}
        <h2 className='text-lg font-semibold'>
          {profileContext?.userProfile.username}
        </h2>
        {profileContext.currentStreak > 0 && (
          <p className='mb-4 flex items-end gap-1 text-sm text-gray-500'>
            Current Streak: {profileContext.currentStreak} days{' '}
            <Flame className={streakColor()} />
          </p>
        )}
      </div>
      <div className='mb-6 flex w-full justify-between px-6'>
        {' '}
        {/* <-- Removed flex-grow from here */}
        <div className='flex flex-grow flex-col justify-end text-center'>
          {' '}
          {/* <-- Add flex-grow, flex and flex-col here, and justify-end to align text to the bottom */}
          <p className='font-semibold'>Favorite Muscle</p>
          <p>{profileContext.favoriteMuscle?.name}</p>
        </div>
        <div className='flex flex-grow flex-col justify-end text-center'>
          {' '}
          {/* <-- Same here */}
          <p className='font-semibold'>Level</p>
          <p>{profileContext?.userProfile.level}</p>
        </div>
        <div className='flex  flex-grow flex-col justify-end text-center'>
          {' '}
          {/* <-- And here */}
          <p className='font-semibold'>Workouts</p>
          <p>{profileContext.workouts.length}</p>
        </div>
        <div className='flex  flex-grow flex-col justify-end text-center'>
          {' '}
          {/* <-- And here */}
          <p className='font-semibold'>Longest Streak</p>
          <p>{profileContext.longestStreak} days</p>
        </div>
      </div>
      <div className='flex justify-between gap-2  md:hidden'>
        <AddFriendButton
          userId={profileContext?.userProfile.userid}
          _friendName={profileContext?.userProfile.username}
        />
        <ButtonLink
          variant='light'
          href={`/dashboard/profile/${profileContext?.userProfile.username}/history/`}
        >
          See all Workouts
        </ButtonLink>
      </div>
    </div>
  );
});

export default ProfileInfoCard;
