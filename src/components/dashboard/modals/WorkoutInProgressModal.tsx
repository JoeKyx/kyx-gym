'use client';
import { FC } from 'react';
import { Drawer } from 'vaul';

import Button from '@/components/buttons/Button';
type WorkoutInProgressModalProps = {
  onDismiss: () => void;
  onContinue: () => void;
  onDelete: () => void;
  open: boolean;
};

const WorkoutInProgressModal: FC<WorkoutInProgressModalProps> = ({
  onDismiss,
  open,
  onContinue,
  onDelete,
}) => {
  const onDeletePrevWorkout = () => {
    onDelete();
  };

  return (
    <Drawer.Root dismissible={false} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-[10px] bg-zinc-100'>
          <div className='flex-1 rounded-t-[10px] bg-white p-4'>
            <div className='mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300' />
            <div className='mx-auto max-w-md'>
              <Drawer.Title className='mb-4 font-medium'>
                You have a workout in progress!
              </Drawer.Title>
              <p className='mb-2 text-zinc-600'>
                You still have a workout in progress. Do you want to continue it
                or delete it and start a new one?
              </p>
              <div className='flex flex-col gap-2'>
                <Button
                  variant='primary'
                  className='w-full'
                  onClick={onContinue}
                >
                  Continue Active Workout
                </Button>
                <Button
                  variant='danger'
                  className='w-full'
                  onClick={onDeletePrevWorkout}
                >
                  Delete Active Workout
                </Button>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={onDismiss}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default WorkoutInProgressModal;
