'use client';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { deleteWorkout, hasActiveWorkout } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import WorkoutInProgressModal from '@/components/dashboard/modals/WorkoutInProgressModal';
import DashboardLink from '@/components/links/DashboardLink';
interface NewWorkoutButtonProps {
  className?: string;
}

const NewWorkoutButton: FC<NewWorkoutButtonProps> = () => {
  const socialContext = useSocial();
  const router = useRouter();

  const [prevWorkoutId, setPrevWorkoutId] = useState<number | null>(null);

  const [prevWorkoutModalOpen, setPrevWorkoutModalOpen] = useState(false);

  const userId = socialContext?.userProfile?.userid;

  const [text, _setText] = useState('Workout from Template');
  const [loading, setLoading] = useState(false);
  if (!userId) return null;

  const startNewWorkout = async () => {
    // Check if user has a workout in progress
    const workout = await hasActiveWorkout(userId);
    if (workout.success && workout.data) {
      setPrevWorkoutId(workout.data.id);
      setPrevWorkoutModalOpen(true);
    } else {
      // Navigate to the workout page
      router.push(`/dashboard/workout/templates/`);
      setLoading(false);
    }
  };

  const onDeletePrevWorkout = async () => {
    if (prevWorkoutId) {
      await deleteWorkout(prevWorkoutId);
    }
    startNewWorkout();
  };

  const onContinuePrevWorkout = () => {
    // Navigate to the workout page
    router.push(`/dashboard/workout/${prevWorkoutId}`);
  };

  const onDismissModal = () => {
    setPrevWorkoutModalOpen(false);
  };

  return (
    <>
      {' '}
      <DashboardLink
        text={text}
        image='/images/dashboard/template.jpeg'
        onClick={startNewWorkout}
        loading={loading}
      />
      <WorkoutInProgressModal
        onContinue={onContinuePrevWorkout}
        onDelete={onDeletePrevWorkout}
        open={prevWorkoutModalOpen}
        onDismiss={onDismissModal}
      />
    </>
  );
};

export default NewWorkoutButton;
