import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import logger from '@/lib/logger';

import { Database } from '@/types/supabase';
import { Workout } from '@/types/Workout';
const openai = new OpenAI({ apiKey: process.env.NEXT_OPEN_AI_API_KEY });

type OpenAiWorkout = {
  name: string;
  finished_at: string | null;
  workout_items: {
    exercise: {
      name: string;
      muscles: string[] | null;
    };
    sets: {
      reps: number | null;
      weight: number | null;
    }[];
  }[];
};

const params: OpenAI.Chat.CompletionCreateParams = {
  messages: [
    {
      role: 'system',
      content:
        'You are a fitness AI that gives advice to users based on their workout history. You are part of a fitness app in which a user can log their workouts. I will provide you the last 5 workouts for a user and you will provide them advice for their next workouts.',
    },
  ],
  model: 'gpt-4',
};

export async function getAdviceForUser(
  supabase: SupabaseClient<Database>,
  userid: string
) {
  logger(userid, 'Generating Advice for User');
  // Get last 5 workouts for user
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select(
      '*, workout_items(*, exercises(*, muscles(*), exercise_categories(*)), sets(*))'
    )
    .eq('userid', userid)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(5);
  if (error) {
    throw error;
  }
  // Get last 5 workouts for user
  logger(workouts, 'workouts');

  // Convert workouts to OpenAI format
  const openAIWorkouts = workouts.map((workout) => workoutToOpenAI(workout));
  logger('Awaiting OpenAI');
  // Get advice from OpenAI
  try {
    params.messages.push({
      role: 'user',
      content: JSON.stringify(openAIWorkouts),
    });
    logger(params, 'params');
    const completion = await openai.chat.completions.create(params, {
      stream: false,
    });
    const castedCompletion = completion as OpenAI.Chat.ChatCompletion;
    logger(castedCompletion, 'completion');
    return castedCompletion.choices[0].message.content;
  } catch (error) {
    logger(error, 'error');
    return 'Sorry, I am not feeling well today. Please try again later.';
  }
}

const workoutToOpenAI = (workout: Workout) => {
  const openAIWorkout: OpenAiWorkout = {
    name: workout.name,
    finished_at: workout.finished_at,
    workout_items: workout.workout_items.map((workoutItem) => {
      return {
        exercise: {
          name: workoutItem.exercises?.name || 'Unknown Exercise',
          muscles:
            workoutItem.exercises?.muscles.map((muscle) => muscle.name) || null,
        },
        sets: workoutItem.sets.map((set) => {
          return {
            reps: set.reps,
            weight: set.weight,
          };
        }),
      };
    }),
  };
  return openAIWorkout;
};
