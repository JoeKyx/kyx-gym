'use client';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { mockWorkouts } from '@/data/mockWorkouts';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';

type WorkoutAccordionProps = HTMLAttributes<HTMLDivElement>;

const WorkoutAccordion: FC<WorkoutAccordionProps> = forwardRef<
  HTMLDivElement,
  WorkoutAccordionProps
>((props, ref) => {
  const { className, ...rest } = props;

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <div
      className={cn(
        className,
        'rounded-lg bg-gradient-to-b from-slate-50 to-slate-200 p-6 drop-shadow-lg'
      )}
      ref={ref}
      {...rest}
    >
      <h1>Last 5 Workouts</h1>
      <Accordion type='single' collapsible>
        {mockWorkouts.map((workout) => {
          return (
            <AccordionItem value={workout.name} key={workout.name}>
              <AccordionTrigger>{workout.name}</AccordionTrigger>
              <AccordionContent>
                <div className='flex flex-col'>
                  {workout.workout_items.map((exercise) => {
                    return (
                      <div
                        className='flex flex-row items-center justify-between'
                        key={exercise.name}
                      >
                        <div className='flex w-full items-center justify-between'>
                          <div className=' text-lg'>{exercise.name}</div>
                          <div className='text-sm'>
                            {exercise.sets.length} Sets {exercise.sets[0].reps}{' '}
                            {exercise.sets[0].weight
                              ? 'x ' + exercise.sets[0].weight + 'kg'
                              : 'Reps'}{' '}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});

export default WorkoutAccordion;
