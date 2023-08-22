'use client';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { newWorkout } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import DashboardLink from '@/components/links/DashboardLink';
interface NewWorkoutButtonProps {
  className?: string;
}

const NewWorkoutButton: FC<NewWorkoutButtonProps> = () => {
  const socialContext = useSocial();
  const router = useRouter();

  const userId = socialContext?.userProfile?.userid;

  const [text, setText] = useState('New empty Workout');
  const [loading, setLoading] = useState(false);
  if (!userId) return null;

  const startNewWorkout = async () => {
    setText('Setting up workout...');
    setLoading(true);
    const workout_id = await newWorkout(userId);
    if (!workout_id) {
      setText('Error starting workout, try again later');
      setLoading(false);
      return;
    }
    // Navigate to the workout page
    router.push(`/dashboard/workout/${workout_id}`);
    setLoading(false);
  };

  return (
    <DashboardLink
      text={text}
      image='/images/dashboard/newWorkout.jpeg'
      onClick={startNewWorkout}
      loading={loading}
    />
  );
};

export default NewWorkoutButton;
