'use client';
import { StepForward } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { hasActiveWorkout } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import ButtonLink from '@/components/links/ButtonLink';

const ActiveWorkoutNotification: FC = () => {
  const socialContext = useSocial();
  const [activeWorkout, setActiveWorkout] = useState<number | null>(null);

  useEffect(() => {
    const loadActiveWorkout = async () => {
      if (socialContext?.userProfile?.userid) {
        const res = await hasActiveWorkout(socialContext.userProfile.userid);
        if (res.success && res.data) {
          setActiveWorkout(res.data.id);
        } else {
          setActiveWorkout(null);
        }
      }
    };
    loadActiveWorkout();
  }, [socialContext?.userProfile?.userid]);

  return (
    <>
      {' '}
      {activeWorkout && (
        <div className='flex items-center gap-4'>
          <span>You have an active workout!</span>
          <ButtonLink
            href={`/dashboard/workout/${activeWorkout}`}
            leftIcon={StepForward}
          >
            Continue Workout
          </ButtonLink>
        </div>
      )}
    </>
  );
};

export default ActiveWorkoutNotification;
