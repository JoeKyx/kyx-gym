'use client';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { useSocial } from '@/components/context/SocialContext';
import DashboardLink from '@/components/links/DashboardLink';
interface NewWorkoutButtonProps {
  className?: string;
}

const NewWorkoutButton: FC<NewWorkoutButtonProps> = () => {
  const socialContext = useSocial();
  const router = useRouter();

  const userId = socialContext?.userProfile?.userid;

  const [text, _setText] = useState('Workout from Template');
  const [loading, setLoading] = useState(false);
  if (!userId) return null;

  const startNewWorkout = async () => {
    // Navigate to the workout page
    router.push(`/dashboard/workout/templates/`);
    setLoading(false);
  };

  return (
    <DashboardLink
      text={text}
      image='/images/dashboard/template.jpeg'
      onClick={startNewWorkout}
      loading={loading}
    />
  );
};

export default NewWorkoutButton;
