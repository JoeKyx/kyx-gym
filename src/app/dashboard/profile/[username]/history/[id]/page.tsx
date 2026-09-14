import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { syncCookies } from '@/lib/supabase-cookie-adapter';

import HistoryWorkout from '@/components/dashboard/history/workout/HistoryWorkout';

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
  const loadWorkout = async () => {
    const supabase = createServerComponentClient<Database>({
      cookies: syncCookies(cookieStore),
    });
    // TODO: set is loading record is loading set - can be optimized...
    const { data, error } = await supabase
      .from('workouts')
      .select(
        '*, workout_items(*, exercises(*, muscles(*), exercise_categories(*)), sets(*, records(*, sets(*))))'
      )
      .eq('id', params.id)
      .single();
    if (error) {
      return { success: false, error };
    } else {
      return { success: true, data };
    }
  };
  const workout = await loadWorkout();

  if (!workout.success || !workout.data) {
    return <div>error</div>;
  }

  return (
    <main>
      <HistoryWorkout workout={workout.data} />
    </main>
  );
}
