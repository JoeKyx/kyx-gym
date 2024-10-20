'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Dumbbell, Loader2 } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { useProfile } from '@/components/context/ProfileContext';
import UserDisplay from '@/components/dashboard/UserDisplay';
import PathNav from '@/components/navbar/PathNav';
import Skeleton from '@/components/Skeleton';

import { Database } from '@/types/supabase';
import { FavoriteExercise, MaxVolumeSet, MaxWeightSet } from '@/types/Workout';
type MainStatsHeaderProps = HTMLAttributes<HTMLDivElement>;

const MainStatsHeader: FC<MainStatsHeaderProps> = forwardRef<
  HTMLDivElement,
  MainStatsHeaderProps
>((props, ref) => {
  const { className, ...rest } = props;

  const profileContext = useProfile();

  type FavoriteExerciseData = {
    loading: boolean;
    favoriteExercise: FavoriteExercise | null;
  };

  type MaxVolumeData = {
    loading: boolean;
    maxVolume: MaxVolumeSet | null;
  };

  type MaxWeightData = {
    loading: boolean;
    maxWeight: MaxWeightSet | null;
  };

  const [favoriteExerciseData, setFavoriteExerciseData] =
    useState<FavoriteExerciseData>({
      loading: true,
      favoriteExercise: null,
    });

  const [maxVolumeData, setMaxVolumeData] = useState<MaxVolumeData>({
    loading: true,
    maxVolume: null,
  });

  const [maxWeightData, setMaxWeightData] = useState<MaxWeightData>({
    loading: true,
    maxWeight: null,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      profileContext.userProfile?.userid &&
      profileContext.workouts.length > 0
    ) {
      const loadFavoriteExercise = async () => {
        const supabase = createClientComponentClient<Database>();

        const { data, error } = await supabase
          .from('favorite_exercise')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid)
          .single();
        if (error) {
          setError(error.message);
          setFavoriteExerciseData({
            loading: false,
            favoriteExercise: null,
          });
        } else {
          setFavoriteExerciseData({
            loading: false,
            favoriteExercise: data,
          });
        }
      };
      loadFavoriteExercise();
    }
  }, [profileContext.userProfile?.userid, profileContext.workouts]);

  useEffect(() => {
    if (
      profileContext.userProfile?.userid &&
      profileContext.workouts.length > 0
    ) {
      const loadMaxVolumeSet = async () => {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('most_volume_set')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid)
          .single();
        if (error) {
          setError(error.message);
          setMaxVolumeData({
            loading: false,
            maxVolume: null,
          });
        } else {
          setMaxVolumeData({
            loading: false,
            maxVolume: data,
          });
        }
      };
      loadMaxVolumeSet();
    }
  }, [profileContext.userProfile?.userid, profileContext.workouts.length]);

  useEffect(() => {
    if (
      profileContext.userProfile?.userid &&
      profileContext.workouts.length > 0
    ) {
      const loadMaxWeightSet = async () => {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('max_weight')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid)
          .single();
        if (error) {
          setError(error.message);
          setMaxWeightData({
            loading: false,
            maxWeight: null,
          });
        } else {
          setMaxWeightData({
            loading: false,
            maxWeight: data,
          });
        }
      };
      loadMaxWeightSet();
    }
  }, [profileContext.userProfile?.userid, profileContext.workouts.length]);

  if (!profileContext.userProfile) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  return (
    <div
      className={cn(className, 'flex w-full flex-col bg-white p-2 shadow-md')}
      ref={ref}
      {...rest}
    >
      <PathNav
        paths={[
          {
            name: 'Dashboard',
            href: '/dashboard',
          },
          {
            name: profileContext?.userProfile?.username,
            href: `/dashboard/profile/${profileContext?.userProfile?.username}`,
          },
          {
            name: 'Stats',
            href: `/dashboard/profile/${profileContext?.userProfile?.username}/stats`,
          },
        ]}
      />
      <div className='flex flex-row items-center justify-between'>
        <div className='flex w-3/4 flex-col gap-2'>
          <h1 className='text-2xl font-semibold'>
            {profileContext.userProfile.username} Stats
          </h1>
          {error && <p className='text-red-500'>{error}</p>}
          <p className='text-sm text-gray-500'>
            {profileContext.userProfile.username} registered on{' '}
            <strong>
              {format(
                new Date(profileContext.userProfile.registered),
                'dd.MM.yyyy'
              )}
            </strong>{' '}
            they completed{' '}
            <strong>
              {
                profileContext.workouts.filter((wo) => wo.status === 'finished')
                  .length
              }{' '}
              workouts{' '}
            </strong>{' '}
            since then. Their longest streak was{' '}
            <strong>{profileContext.longestStreak} days</strong> and their
            current streak is{' '}
            <strong>{profileContext.currentStreak} days.</strong>
          </p>
          {profileContext.workouts.length > 0 && (
            <div className='flex items-center gap-4'>
              <Dumbbell className='text-primary-500' />
              <div className='flex flex-col gap-2'>
                {favoriteExerciseData.loading ? (
                  <Skeleton className='h-5 w-3/4' />
                ) : (
                  favoriteExerciseData.favoriteExercise && (
                    <p className='text-sm text-gray-500'>
                      Favorite exercise:{' '}
                      <strong>
                        {favoriteExerciseData.favoriteExercise?.exercise_name}
                      </strong>{' '}
                      ({favoriteExerciseData.favoriteExercise.amount} times)
                    </p>
                  )
                )}
                {maxVolumeData.loading ? (
                  <Skeleton className='h-5 w-3/4' />
                ) : (
                  maxVolumeData.maxVolume && (
                    <p className='text-sm text-gray-500'>
                      Max volume:{' '}
                      <strong>{maxVolumeData.maxVolume.volume} KG</strong>{' '}
                      {maxVolumeData.maxVolume?.name} - (
                      {maxVolumeData.maxVolume?.weight} kg x{' '}
                      {maxVolumeData.maxVolume?.reps} reps){' '}
                      <span className='italic'>
                        Date:{' '}
                        {maxVolumeData.maxVolume.finished_at &&
                          format(
                            new Date(maxVolumeData.maxVolume.finished_at),
                            'dd.MM.yyyy'
                          )}
                      </span>
                    </p>
                  )
                )}
                {maxWeightData.loading ? (
                  <Skeleton className='h-5 w-3/4' />
                ) : (
                  maxWeightData.maxWeight && (
                    <p className='text-sm text-gray-500'>
                      Max weight:{' '}
                      <strong>{maxWeightData.maxWeight.weight} KG</strong>{' '}
                      {maxWeightData.maxWeight?.name} - (
                      {maxWeightData.maxWeight.reps} Reps){' '}
                      <span className='italic'>
                        Date:{' '}
                        {maxWeightData.maxWeight.finished_at &&
                          format(
                            new Date(maxWeightData.maxWeight.finished_at),
                            'dd.MM.yyyy'
                          )}
                      </span>
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
        <UserDisplay userProfile={profileContext.userProfile} />
      </div>
    </div>
  );
});

export default MainStatsHeader;
