import { FC, forwardRef, HTMLAttributes, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

import { DBTemplate, Template } from '@/types/Workout';

type TemplateNameProps = HTMLAttributes<HTMLInputElement> & {
  template: Template | DBTemplate;
  isOwnTemplate: boolean;
  onNewName: (newName: string) => void;
};

const WorkoutName: FC<TemplateNameProps> = forwardRef<
  HTMLDivElement,
  TemplateNameProps
>((props, ref, ...rest) => {
  const { template, isOwnTemplate, onNewName, className } = props;
  const [workoutName, setWorkoutName] = useState<string>(template.name);
  const [_isNameEdited, setIsNameEdited] = useState<boolean>(false);
  const [initialWorkoutName, _setInitialWorkoutName] = useState<string>(
    template.name
  );

  const handleNameChange = useCallback(
    async (newName: string) => {
      if (!isOwnTemplate) return;
      if (workoutName === initialWorkoutName) return;
      onNewName(newName);
    },
    [isOwnTemplate, workoutName, initialWorkoutName, onNewName]
  );

  return isOwnTemplate ? (
    <input
      {...rest}
      type='text'
      className={cn(
        'background-transparent mb-2 w-full border-0 p-0 text-lg font-semibold outline-none',
        className
      )}
      value={workoutName}
      onChange={(e) => {
        setWorkoutName(e.target.value);
        setIsNameEdited(true);
        handleNameChange(e.target.value);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const newName = (e.target as HTMLInputElement).value;
          if (newName !== workoutName) {
            setWorkoutName(newName);
            setIsNameEdited(true);
            handleNameChange(newName);
          }
          (e.target as HTMLElement).blur();
        }
      }}
    />
  ) : (
    <p ref={ref} className={cn('mb-2 text-lg font-semibold', className)}>
      {' '}
      {template.name}
    </p>
  );
});

export default WorkoutName;
