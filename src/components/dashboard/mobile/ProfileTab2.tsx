import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { loadFinishedWorkouts } from '@/lib/supabase-util';

import { ProfileProvider } from '@/components/context/ProfileContext';
import { useSocial } from '@/components/context/SocialContext';
import Profile from '@/components/dashboard/profile/Profile';

import { DBWorkout } from '@/types/Workout';

type ProfileTab2Props = HTMLAttributes<HTMLDivElement>;

const ProfileTab2: FC<ProfileTab2Props> = forwardRef<
  HTMLDivElement,
  ProfileTab2Props
>((props, ref) => {
  const { className, ...rest } = props;
  const socialContext = useSocial();

  const [workouts, setWorkouts] = useState<DBWorkout[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!socialContext?.userProfile?.userid) return;
      const dbWorkoutsRes = await loadFinishedWorkouts(
        socialContext?.userProfile?.userid
      );
      const dbWorkouts = dbWorkoutsRes?.data;
      if (!dbWorkouts) return;
      setWorkouts(dbWorkouts);
    };
    loadData();
  }, [socialContext?.userProfile?.userid]);

  return (
    <div className={className} ref={ref} {...rest}>
      {socialContext?.userProfile && (
        <ProfileProvider
          userProfile={socialContext?.userProfile}
          workouts={workouts}
        >
          <Profile />
        </ProfileProvider>
      )}
    </div>
  );
});

export default ProfileTab2;
