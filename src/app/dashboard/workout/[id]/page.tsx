import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FC } from 'react';

import logger from '@/lib/logger';

import { ActiveWorkoutProvider } from '@/components/context/ActiveWorkoutContext';
import ActiveWorkoutArea from '@/components/dashboard/workout/active/ActiveWorkoutArea';
import ButtonLink from '@/components/links/ButtonLink';
import Heading from '@/components/text/Heading';

import { Database } from '@/types/supabase';

interface pageProps {
  params: {
    id: string;
  };
}

const page: FC<pageProps> = async ({ params }) => {
  async function getWorkout() {
    let errorLoading = false;
    const supabase = createServerComponentClient<Database>({
      cookies,
    });
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error) {
      logger(error);
      errorLoading = true;
      return { success: false, errorLoading };
    } else {
      logger(data);
      return { success: true, data };
    }
  }
  const workout = await getWorkout();

  if (!workout.success) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <Heading>Error loading workout</Heading>
        <Heading size='sm'>Is your Internet connection working?</Heading>

        <ButtonLink variant='outline' className='mt-5' href='/dashboard'>
          Back to Dashboard
        </ButtonLink>
      </div>
    );
  }

  if (workout.data?.status === 'active') {
    return (
      <ActiveWorkoutProvider workout_id={params.id}>
        <ActiveWorkoutArea />
      </ActiveWorkoutProvider>
    );
  } else if (workout.data?.status === 'finished') {
    const link = `/dashboard/history/workout/${workout.data.id}`;
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <Heading>Workout is finished</Heading>
        <Heading size='sm'>You can view the results in the History</Heading>
        <ButtonLink variant='primary' className='mt-5' href={link}>
          View Workout in History
        </ButtonLink>
        <ButtonLink variant='outline' className='mt-5' href='/dashboard'>
          Back to Dashboard
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col items-center justify-center'>
      <Heading>Can't find this Workout!</Heading>
      <ButtonLink variant='outline' className='mt-5' href='/dashboard'>
        Back to Dashboard
      </ButtonLink>
    </div>
  );
};

export default page;
