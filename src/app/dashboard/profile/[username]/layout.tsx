import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import logger from '@/lib/logger';

import { ProfileProvider } from '@/components/context/ProfileContext';

import { Database } from '@/types/supabase';

interface pageProps {
  children: React.ReactNode;
  params: {
    username: string;
  };
}
export const dynamic = 'force-dynamic';

export default async function Layout({ params, children }: pageProps) {
  const loadUserProfile = async () => {
    const supabase = createServerComponentClient<Database>({
      cookies,
    });
    // Make %20 to space
    params.username = params.username.replace(/%20/g, ' ');
    logger(params.username, 'username');
    const { data, error } = await supabase
      .from('userprofile')
      .select('*, profile_icons(*)')
      .eq('username', params.username)
      .single();
    if (error) {
      return { success: false, error };
    } else {
      logger(data, 'data');
      return { success: true, data };
    }
  };
  const userProfile = await loadUserProfile();

  if (!userProfile.success || !userProfile.data) {
    return (
      <div>
        {params.username} {userProfile.error?.message}
      </div>
    );
  }

  const loadWorkouts = async () => {
    const supabase = createServerComponentClient<Database>({
      cookies,
    });
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('userid', userProfile.data.userid)
      .eq('status', 'finished')
      .order('created_at', { ascending: false });
    if (error) {
      return { success: false, error };
    } else {
      return { success: true, data };
    }
  };
  const workouts = await loadWorkouts();

  if (!workouts.success || !workouts.data) {
    return (
      <div>
        {params.username} {workouts.error?.message}
      </div>
    );
  }

  return (
    <ProfileProvider userProfile={userProfile.data} workouts={workouts.data}>
      {children}
    </ProfileProvider>
  );
}
