import { useRouter } from 'next/navigation';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import {
  deleteWorkout,
  hasActiveWorkout,
  newWorkout,
} from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import MobileImageButton from '@/components/dashboard/mobile/MobileImageButton';
import WorkoutInProgressModal from '@/components/dashboard/modals/WorkoutInProgressModal';

type WorkoutTabProps = HTMLAttributes<HTMLDivElement>;

const WorkoutTab: FC<WorkoutTabProps> = forwardRef<
  HTMLDivElement,
  WorkoutTabProps
>((props, ref) => {
  const { className, ...rest } = props;

  const router = useRouter();

  const [loadingNewWorkout, setLoadingNewWorkout] = useState(false);
  const [newWorkoutText, setNewWorkoutText] = useState('New Workout');
  const [prevWorkoutId, setPrevWorkoutId] = useState<number | null>(null);
  const [prevWorkoutModalOpen, setPrevWorkoutModalOpen] = useState(false);
  const socialContext = useSocial();

  const checkIsPrevWorkout = async () => {
    if (!userid) return;
    const workout = await hasActiveWorkout(userid);
    if (workout.success && workout.data) {
      setPrevWorkoutId(workout.data.id);
      setPrevWorkoutModalOpen(true);
      return true;
    }
    return false;
  };

  const userid = socialContext?.userProfile?.userid;
  const username = socialContext?.userProfile?.username;

  const [templateFunctionCalled, setTemplateFunctionCalled] = useState(false);

  const onNewWorkoutClick = async () => {
    if (!userid) return;
    setLoadingNewWorkout(true);
    const isPrev = await checkIsPrevWorkout();

    if (isPrev) return;
    const workout_id = await newWorkout(userid);
    if (!workout_id) {
      setNewWorkoutText('Error starting workout, try again later');
      setLoadingNewWorkout(false);
      return;
    }
    // Navigate to the workout page
    router.push(`/dashboard/workout/${workout_id}`);
  };

  const onWorkoutFromTemplateClick = async () => {
    setTemplateFunctionCalled(true);
    const isPrev = await checkIsPrevWorkout();

    if (isPrev) return;
    router.push(`/dashboard/workout/templates/`);
  };

  const onContinuePrevWorkout = () => {
    // Navigate to the workout page
    router.push(`/dashboard/workout/${prevWorkoutId}`);
  };

  const onDeletePrevWorkout = async () => {
    if (prevWorkoutId) {
      await deleteWorkout(prevWorkoutId);
    }
    if (templateFunctionCalled) {
      onWorkoutFromTemplateClick();
    } else {
      onNewWorkoutClick();
    }

    setPrevWorkoutModalOpen(false);
  };

  const onDismissModal = () => {
    setPrevWorkoutModalOpen(false);
    setTemplateFunctionCalled(false);
  };

  const onChallengeClick = () => {
    router.push(`/dashboard/profile/${username}/challenges`);
  };

  return (
    <div
      className={cn('flex h-full w-full flex-col gap-4', className)}
      ref={ref}
      {...rest}
    >
      <MobileImageButton
        title={newWorkoutText}
        image='/images/dashboard/newWorkoutMobile.jpeg'
        onClickHandler={onNewWorkoutClick}
        isLoading={loadingNewWorkout}
      />
      <MobileImageButton
        title='Workout from Template'
        image='/images/dashboard/workoutFromTemplateMobile.jpeg'
        onClickHandler={onWorkoutFromTemplateClick}
      />
      <MobileImageButton
        title='Challenges'
        image='/images/dashboard/comingSoonMobile.jpeg'
        onClickHandler={onChallengeClick}
      />
      <WorkoutInProgressModal
        onContinue={onContinuePrevWorkout}
        onDelete={onDeletePrevWorkout}
        open={prevWorkoutModalOpen}
        onDismiss={onDismissModal}
      />
    </div>
  );
});

export default WorkoutTab;
