'use client';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import logger from '@/lib/logger';
import {
  deleteWorkout,
  hasActiveWorkout,
  newWorkout,
} from '@/lib/supabase-util';

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

  const [text, setText] = useState('New empty Workout');
  const [loading, setLoading] = useState(false);
  if (!userId) return null;

  const startNewWorkout = async () => {
    setText('Setting up workout...');
    setLoading(true);
    // Check if user has a workout in progress
    logger(userId, 'User ID');
    const workout = await hasActiveWorkout(userId);
    logger(workout, 'Active Workout?');
    if (workout.success && workout.data) {
      setPrevWorkoutId(workout.data.id);
      setPrevWorkoutModalOpen(true);
    } else {
      logger(workout, 'No active workout, starting new workout');
      const workout_id = await newWorkout(userId);
      if (!workout_id) {
        setText('Error starting workout, try again later');
        setLoading(false);
        return;
      }
      // Navigate to the workout page
      router.push(`/dashboard/workout/${workout_id}`);
      setLoading(false);
    }
  };

  const onDeletePrevWorkout = async () => {
    logger(prevWorkoutId, 'Deleting workout');
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
      <DashboardLink
        text={text}
        image='/images/dashboard/newWorkout.jpeg'
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
