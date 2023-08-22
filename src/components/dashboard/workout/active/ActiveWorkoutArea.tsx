'use client';
import * as Tabs from '@radix-ui/react-tabs';
import { FC, useState } from 'react';

import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import ActiveWorkout from '@/components/dashboard/workout/active/ActiveWorkout';
import AddExercises from '@/components/dashboard/workout/active/AddExercises';

const ActiveWorkoutArea: FC = () => {
  const triggerClass =
    'hover:text-primary-300 transition-all duration-300 flex align-center w-full justify-center h-8 text-primary-500 radix-state-active:text-primary-600 radix-state-active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.6)]';

  const activeWorkoutContext = useActiveWorkout();

  const [activeTab, setActiveTab] = useState<'workout' | 'exercises'>(
    'workout'
  );

  if (activeWorkoutContext.loading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs.Root
      className='flex h-screen w-full flex-col justify-start bg-slate-200'
      defaultValue='workout'
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as 'workout' | 'exercises')}
    >
      <Tabs.List className='flex h-10 items-start justify-evenly gap-5 bg-white pt-2 shadow-md'>
        <Tabs.Trigger value='workout' className={triggerClass}>
          Active Workout
        </Tabs.Trigger>
        <Tabs.Trigger value='exercises' className={triggerClass}>
          Add Exercises
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value='workout'
        className='radix-state-active:h-full flex max-h-screen flex-col overflow-hidden md:max-h-full'
      >
        <ActiveWorkout className='mx-4 h-full px-4' />
      </Tabs.Content>
      <Tabs.Content
        value='exercises'
        className='radix-state-active:h-full flex max-h-screen flex-col overflow-hidden md:max-h-full'
      >
        <AddExercises onExercisesAdded={() => setActiveTab('workout')} />
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default ActiveWorkoutArea;
