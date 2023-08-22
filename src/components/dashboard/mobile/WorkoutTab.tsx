import { useRouter } from 'next/navigation';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import { newWorkout } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import MobileImageButton from '@/components/dashboard/mobile/MobileImageButton';

type WorkoutTabProps = HTMLAttributes<HTMLDivElement>;

const WorkoutTab: FC<WorkoutTabProps> = forwardRef<
  HTMLDivElement,
  WorkoutTabProps
>((props, ref) => {
  const { className, ...rest } = props;

  const router = useRouter();

  const [loadingNewWorkout, setLoadingNewWorkout] = useState(false);
  const [newWorkoutText, setNewWorkoutText] = useState('New Workout');
  const socialContext = useSocial();

  const userid = socialContext?.userProfile?.userid;

  const onNewWorkoutClick = async () => {
    if (!userid) return;
    setLoadingNewWorkout(true);
    const workout_id = await newWorkout(userid);
    if (!workout_id) {
      setNewWorkoutText('Error starting workout, try again later');
      setLoadingNewWorkout(false);
      return;
    }
    // Navigate to the workout page
    router.push(`/dashboard/workout/${workout_id}`);
  };

  const onWorkoutFromTemplateClick = () => {
    router.push(`/dashboard/workout/templates/`);
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
        title='Challenges - coming soon'
        image='/images/dashboard/comingSoonMobile.jpeg'
        isDisabled
      />
    </div>
  );
});

export default WorkoutTab;
