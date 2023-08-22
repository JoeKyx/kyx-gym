import { formatRelative } from 'date-fns';
import { useRouter } from 'next/navigation';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';
import {
  newWorkoutFromTemplate,
  updateTemplateName,
} from '@/lib/supabase-util';

import Button from '@/components/buttons/Button';
import { useSocial } from '@/components/context/SocialContext';
import TemplateName from '@/components/dashboard/TemplateName';

import { Template } from '@/types/Workout';

type TemplateContainerProps = HTMLAttributes<HTMLDivElement> & {
  template: Template;
};

const TemplateContainer: FC<TemplateContainerProps> = forwardRef<
  HTMLDivElement,
  TemplateContainerProps
>((props, ref) => {
  const { className, template, ...rest } = props;

  const socialContext = useSocial();
  const router = useRouter();

  const lastPerformedDate = template.last_performed
    ? new Date(template.last_performed)
    : null;

  const lastPerformedText = lastPerformedDate
    ? formatRelative(lastPerformedDate, Date.now())
    : 'Never';

  const [_templateName, setTemplateName] = useState<string>(template.name);
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onTemplateNameChange = async (newName: string) => {
    setTemplateName(newName);
    await updateTemplateName(template.id, newName);
  };

  const onStartWorkout = async () => {
    logger('Starting workout from template');
    if (!socialContext?.userProfile?.userid) {
      setErrorMessage('You must be logged in to start a workout');
      return;
    }
    setLoadingTemplate(true);
    const workoutId = await newWorkoutFromTemplate(
      socialContext.userProfile?.userid,
      template.id
    );
    if (workoutId.error) {
      setErrorMessage(workoutId.error);
    } else {
      router.push(`/dashboard/workout/${workoutId.data}`);
    }
    setLoadingTemplate(false);
  };

  return (
    <div
      className={cn('rounded-md bg-white p-4 shadow-md', className)}
      ref={ref}
      {...rest}
    >
      <div className='flex items-center justify-between'>
        <div className='flex w-full justify-between'>
          <div className='flex flex-col gap-2'>
            <TemplateName
              template={template}
              isOwnTemplate={true}
              onNewName={onTemplateNameChange}
              className='text-sm'
            />
            {errorMessage && (
              <span className='text-sm text-red-500'>{errorMessage}</span>
            )}

            {template.amount_of_times_performed &&
              template.amount_of_times_performed > 0 && (
                <span>
                  Performed {template.amount_of_times_performed} times
                </span>
              )}
            <span>Last Performed: {lastPerformedText}</span>
          </div>
          <div className='flex flex-col items-end justify-between gap-2'>
            <span className='text-sm text-gray-500'>
              {template.main_muscle_filled?.name}
            </span>
            <Button isLoading={loadingTemplate} onClick={onStartWorkout}>
              Start Workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TemplateContainer;
