import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import HistoryWorkout from '@/components/dashboard/history/workout/HistoryWorkout';

import { Database } from '@/types/supabase';
interface pageProps {
  params: {
    id: string;
  };
}
export const dynamic = 'force-dynamic';
export default async function Page({ params }: pageProps) {
  const loadWorkout = async () => {
    const supabase = createServerComponentClient<Database>({
      cookies,
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
