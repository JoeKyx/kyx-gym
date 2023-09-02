import { Database } from '@/types/supabase';

export type ExerciseHistory =
  Database['public']['Views']['exercise_history']['Row'];
