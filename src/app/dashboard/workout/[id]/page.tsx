import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import logger from '@/lib/logger';
import { syncCookies } from '@/lib/supabase-cookie-adapter';

import { ActiveWorkoutProvider } from '@/components/context/ActiveWorkoutContext';
import ActiveWorkoutArea from '@/components/dashboard/workout/active/ActiveWorkoutArea';
import ButtonLink from '@/components/links/ButtonLink';
import Heading from '@/components/text/Heading';

import { Database } from '@/types/supabase';

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function Page(props: pageProps) {
  const cookieStore = await cookies();
  const params = await props.params;
  const workoutId = parseInt(params.id, 10);

  async function getWorkout() {
    let errorLoading = false;
    const supabase = createServerComponentClient<Database>({
      cookies: syncCookies(cookieStore),
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !Number.isSafeInteger(workoutId) || workoutId < 1)
      return { success: false, errorLoading: true };
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('userid', user.id)
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
      <ActiveWorkoutProvider workout_id={workoutId}>
        <ActiveWorkoutArea />
      </ActiveWorkoutProvider>
    );
  } else if (workout.data?.status === 'finished') {
    const db = createServerComponentClient<Database>({
      cookies: syncCookies(cookieStore),
    });
    const { data: profile } = await db
      .from('userprofile')
      .select('username')
      .eq('userid', workout.data.userid)
      .single();
    const link = profile
      ? `/dashboard/profile/${encodeURIComponent(profile.username)}/history/${
          workout.data.id
        }`
      : '/dashboard';
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
}
