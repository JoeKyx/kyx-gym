import { Database } from '@/types/supabase';
import { UserProfile } from '@/types/UserProfile';

export type DBWorkout = Database['public']['Tables']['workouts']['Row'];
export type DBUpdateWorkout =
  Database['public']['Tables']['workouts']['Update'];
export type DBWorkoutItem =
  Database['public']['Tables']['workout_items']['Row'];
export type DBSet = Database['public']['Tables']['sets']['Row'];
export type UpdateSet = Database['public']['Tables']['sets']['Update'];
export type DBUpdateSet = Database['public']['Tables']['sets']['Update'];
export type DBInsertSet = Database['public']['Tables']['sets']['Insert'];
export type DBCategory =
  Database['public']['Tables']['exercise_categories']['Row'];
export type DBMuscle = Database['public']['Tables']['muscles']['Row'];
export type DBExercise = Database['public']['Tables']['exercises']['Row'];
export type DBInsertExercise =
  Database['public']['Tables']['exercises']['Insert'];
export type DBRecord = Database['public']['Tables']['records']['Row'];
export type DBCalendar = Database['public']['Tables']['calendar']['Row'];
export type SetUpdate = Partial<DBUpdateSet>;
export type DBTemplate = Database['public']['Tables']['templates']['Row'];
export type DBUpdateTemplate =
  Database['public']['Tables']['templates']['Update'];
export type DBInsertTemplate =
  Database['public']['Tables']['templates']['Insert'];
export type DBTemplateItem =
  Database['public']['Tables']['template_items']['Row'];
export type DBInsertTemplateItem =
  Database['public']['Tables']['template_items']['Insert'];
export type DBExperienceLevel =
  Database['public']['Tables']['experience_level']['Row'];
export type DBExerciseType =
  Database['public']['Tables']['exercises']['Row']['type'];

export type FavoriteExercise =
  Database['public']['Views']['favorite_exercise']['Row'];

export type MaxVolumeSet =
  Database['public']['Views']['most_volume_set']['Row'];

export type MaxWeightSet = Database['public']['Views']['max_weight']['Row'];

export type CategoryCountSummary =
  Database['public']['Views']['category_count']['Row'];

export type MuscleCountSummary =
  Database['public']['Views']['muscles_count']['Row'];

export enum SetType {
  Normal = 'normal',
  Drop = 'drop',
  Warmup = 'warmup',
  Super = 'super',
  Insane = 'insane',
}

export type Exercise = DBExercise & {
  exercise_categories: DBCategory | null;
  muscles: DBMuscle[];
};

export type WorkoutItem = DBWorkoutItem & {
  sets: Set[];
  exercises: Exercise | null;
};

export type Workout = DBWorkout & {
  workout_items: WorkoutItem[];
};

export type Record = DBRecord & {
  sets: DBSet | null;
};

export type HistoryWorkout = DBWorkout & {
  workout_items: HistoryWorkoutItem[];
};

export type HistoryWorkoutItem = DBWorkoutItem & {
  sets: HistorySet[];
  exercises: Exercise | null;
};

export type HistorySet = DBSet & {
  records: Record[];
};

export type Template = DBTemplate & {
  main_muscle_filled: DBMuscle | null;
  template_items: TemplateItem[];
  owner: UserProfile | null;
};

export type TemplateItem = DBTemplateItem & {
  exercise: Exercise | null;
};

export type FilledTemplate = DBTemplate & {
  template_items: TemplateItem[];
};

export type Set = DBSet & {
  previous_set?: PreviousSet | null;
};

export type PreviousSet = {
  id: number;
  exercise_id: number;
  position: number;
  workout_item_id: number;
  is_finished: boolean;
  weight: number;
  reps: number;
};
