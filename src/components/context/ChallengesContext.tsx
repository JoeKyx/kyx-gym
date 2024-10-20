'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import React, { createContext, useContext, useEffect, useState } from 'react';

import logger from '@/lib/logger';

import { useSocial } from '@/components/context/SocialContext';
import { useToast } from '@/components/ui/use-toast';

import { Challenge, DBUserChallenge } from '@/types/Challenge';
import { Database } from '@/types/supabase';

// Define the shape of your context
interface ChallengeContextProps {
  availableChallenges: Challenge[];
  userCompletedChallenges: Challenge[];
}

// Initial context value
const defaultContextValue: ChallengeContextProps | null = null;

const ChallengeContext = createContext<ChallengeContextProps | null>(
  defaultContextValue
);

export const useChallenges = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengeProvider');
  }
  return context;
};

interface ChallengeProviderProps {
  children: React.ReactNode;
}

export const ChallengeProvider: React.FC<ChallengeProviderProps> = ({
  children,
}) => {
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>(
    []
  );
  const [userCompletedChallenges, setUserCompletedChallenges] = useState<
    Challenge[]
  >([]);
  const [_isInitialLoad, setIsInitialLoad] = useState(true);
  const supabase = createClientComponentClient<Database>();

  const socialContext = useSocial();

  const { toast } = useToast();

  useEffect(() => {
    const fetchChallenges = async () => {
      logger('fetching challenges');
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*, profile_icons: profile_icons(*)');
      if (error) {
        logger(error, 'Error fetching challenges');
      } else {
        logger(challenges, 'challenges');
        setAvailableChallenges(challenges);
      }
    };
    fetchChallenges();
  }, [supabase]);

  useEffect(() => {
    if (!socialContext?.userProfile?.userid) return;
    const fetchCompletedChallenges = async () => {
      if (!socialContext?.userProfile?.userid) return;
      logger('fetching completed challenges');
      const { data: completedChallengesWrapped, error } = await supabase
        .from('user_challenges')
        .select('challenge: challenges(*, profile_icons(*))')
        .eq('user_id', socialContext?.userProfile?.userid);
      if (error) {
        logger(error, 'Error fetching completed challenges');
      } else {
        logger(completedChallengesWrapped, 'completedChallengesWrapped');
        const completedChallenges = completedChallengesWrapped.map((wrapped) =>
          wrapped.challenge ? wrapped.challenge : null
        );
        if (completedChallenges.length > 0) {
          setUserCompletedChallenges(
            completedChallenges.filter(
              (challenge) => challenge !== null
            ) as Challenge[]
          );
        }
        setIsInitialLoad(false);
      }
    };
    fetchCompletedChallenges();
    supabase
      .channel('table-db-changes')
      .on<DBUserChallenge>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_challenges',
          filter: 'user_id=eq.' + socialContext?.userProfile?.userid,
        },
        async (payload) => {
          supabase
            .from('challenges')
            .select('*, profile_icons: profile_icons(*)')
            .eq('id', payload.new.challenge_id)
            .single()
            .then(({ data: challenge, error }) => {
              if (error) {
                logger(error, 'Error fetching challenge');
              } else {
                if (challenge) {
                  const text = challenge.hidden
                    ? 'Hidden Challenge Completed!'
                    : 'Challenge Completed!';
                  toast({
                    title: text,
                    description: (
                      <div className='flex w-full items-center gap-4'>
                        <Image
                          className='border-primary-500 rounded-full border'
                          src={`/images/avatars/${challenge.profile_icons[0].path}`}
                          width={50}
                          height={50}
                          alt={`Profile Icon of the challenge: ${challenge.name}`}
                        />
                        <div className='text-sm text-gray-500'>
                          You completed the {challenge.hidden && 'hidden'}{' '}
                          challenge{' '}
                          <span className='font-bold'>{challenge.name}</span>!
                        </div>
                      </div>
                    ),
                  });
                  setUserCompletedChallenges((prev) => [...prev, challenge]);
                }
              }
            });
        }
      )
      .subscribe();
  }, [supabase, socialContext?.userProfile?.userid, toast]);

  return (
    <ChallengeContext.Provider
      value={{
        availableChallenges,
        userCompletedChallenges,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};
