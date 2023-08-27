'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import Button from '@/components/buttons/Button';
import { useChallenges } from '@/components/context/ChallengesContext';
import { useProfile } from '@/components/context/ProfileContext';
import ChallengeContainer from '@/components/dashboard/challenges/ChallengeContainer';
import PathNav from '@/components/navbar/PathNav';
import { WorkoutTip } from '@/components/text/WorkoutTip';

import { ChallengeInformation } from '@/types/Challenge';
import { Database } from '@/types/supabase';

type ChallengesPageProps = HTMLAttributes<HTMLDivElement>;

const ChallengesPage: FC<ChallengesPageProps> = forwardRef<
  HTMLDivElement,
  ChallengesPageProps
>((props, ref) => {
  const { className, ...rest } = props;

  const challengesContext = useChallenges();
  const profileContext = useProfile();

  const [challengeInformation, setChallengeInformation] = useState<
    ChallengeInformation[]
  >([]);

  const [_error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAvailableChallenges, setShowAvailableChallenges] = useState(false);

  useEffect(() => {
    if (!profileContext?.userProfile?.userid) return;
    const supabase = createClientComponentClient<Database>();

    const tmpChallengeInformation: ChallengeInformation[] = [];
    const fetchChallenges = async () => {
      const userChallengesRes = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', profileContext.userProfile.userid);
      if (userChallengesRes.error) {
        logger(userChallengesRes.error, 'Error fetching user challenges');
        setError('Error fetching user challenges');
        return;
      }
      const userChallenges = userChallengesRes.data;
      challengesContext.availableChallenges.forEach((challenge) => {
        const userChallenge = userChallenges.find(
          (userChallenge) => userChallenge.challenge_id === challenge.id
        );
        if (userChallenge) {
          tmpChallengeInformation.push({
            challenge,
            completed: true,
            completed_at: userChallenge.achieved_at,
          });
        } else {
          tmpChallengeInformation.push({
            challenge,
            completed: false,
          });
        }
      });
      setChallengeInformation(tmpChallengeInformation);
      setLoading(false);
    };
    fetchChallenges();
  }, [
    challengesContext.availableChallenges,
    challengesContext.userCompletedChallenges,
    profileContext?.userProfile?.userid,
  ]);

  const totalPoints = challengeInformation.reduce(
    (total, challengeInformation) => {
      if (challengeInformation.completed) {
        return (
          total +
          (challengeInformation.challenge.points
            ? challengeInformation.challenge.points
            : 0)
        );
      }
      return total;
    },
    0
  );

  const challengesCompleted = challengeInformation.filter(
    (challengeInformation) => challengeInformation.completed
  ).length;

  const challengesHidden = challengeInformation.filter(
    (challengeInformation) =>
      challengeInformation.challenge.hidden && !challengeInformation.completed
  ).length;

  if (loading) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <Loader2 className='animate-spin' size={64} />
        <WorkoutTip />
      </div>
    );
  }

  const profileIcon = profileContext.userProfile?.profile_icons?.path
    ? `/images/avatars/${profileContext.userProfile.profile_icons.path}`
    : '/images/avatars/default.jpeg';

  return (
    <main className={cn('mx-2', className)} ref={ref} {...rest}>
      <div className='flex w-full flex-col rounded-md bg-white p-4 shadow-md'>
        <PathNav
          paths={[
            { name: 'Dashboard', href: '/dashboard' },
            {
              name: profileContext.userProfile.username,
              href: `/dashboard/profile/${profileContext.userProfile.username}`,
            },
            { name: 'Challenges' },
          ]}
        />
        <div className='flex items-start justify-between'>
          <div className='mt-2 flex flex-col'>
            <span className='text-xl font-semibold'>
              {profileContext.userProfile.username}
            </span>
            <div className='flex gap-4'>
              <div className='flex flex-col gap-0 '>
                <span className='text-2xl font-bold'>{totalPoints}</span>
                <span className='text-sm text-gray-500'>Challenge Points</span>
              </div>
              <div className='flex flex-col gap-0 '>
                <span className='text-2xl font-bold'>
                  {challengesCompleted}
                </span>
                <span className='text-sm text-gray-500'>
                  Challenges completed
                </span>
              </div>
            </div>
            <Button
              className='mt-2 flex justify-center'
              variant='primary'
              onClick={() => setShowAvailableChallenges((prev) => !prev)}
            >
              Show {showAvailableChallenges ? 'Completed' : 'All'} Challenges
            </Button>
          </div>

          <Image
            className='border-primary-500 rounded-full border'
            src={profileIcon}
            width={80}
            height={80}
            alt={`Profile Icon of the user: ${profileContext.userProfile.username}`}
          />
        </div>
      </div>
      {showAvailableChallenges ? (
        <div className='mt-2 flex flex-col items-center'>
          <span className='text-center text-2xl font-bold'>
            Available Challenges
          </span>
          {challengeInformation
            .filter(
              (challengeInfo) =>
                !challengeInfo.challenge.hidden || challengeInfo.completed
            )
            .map((challengeInformation) => {
              return (
                <ChallengeContainer
                  key={challengeInformation.challenge.id}
                  className='mt-2'
                  challenge={challengeInformation}
                  finished={challengeInformation.completed}
                />
              );
            })}
          <div className='my-4'>
            +{challengesHidden} more hidden Challenges!
          </div>
        </div>
      ) : (
        <div className='mt-2 flex flex-col'>
          <span className='text-center text-2xl font-bold'>
            Completed Challenges
          </span>
          {challengeInformation.filter(
            (challengeInformation) => !challengeInformation.completed
          ).length === 0 ? (
            <div className='mt-4 text-center'>
              You haven't completed any challenges yet! Check out the available
              challenges to get started
            </div>
          ) : null}
          {challengeInformation
            .filter((challengeInformation) => challengeInformation.completed)
            .map((challengeInformation) => {
              return (
                <ChallengeContainer
                  key={challengeInformation.challenge.id}
                  className='mt-2'
                  challenge={challengeInformation}
                  finished={true}
                />
              );
            })}
        </div>
      )}
    </main>
  );
});

export default ChallengesPage;
