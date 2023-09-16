import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatISO } from 'date-fns';

import logger from '@/lib/logger';

import { Database } from '@/types/supabase';
import {
  DBCategory,
  DBExercise,
  DBInsertExercise,
  DBInsertSet,
  DBInsertTemplate,
  DBInsertTemplateItem,
  DBMuscle,
  DBSet,
  DBUpdateWorkout,
  DBWorkoutItem,
  Set,
  UpdateSet,
  Workout,
  WorkoutItem,
} from '@/types/Workout';
const supabase = createClientComponentClient<Database>();

type ExerciseWithMuscleIds = DBExercise & {
  muscles: DBMuscle[];
  exercise_categories: DBCategory | null;
};

type SupabaseUtilReturnType<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

const cache = {
  exercises: {} as Record<string, ExerciseWithMuscleIds>,
  muscles: {} as Record<string, DBMuscle>,
  exerciseCategories: {} as Record<string, DBCategory>,
};

export const newWorkout = async (userid: string): Promise<number> => {
  logger(userid, 'userid');

  const user = await supabase.auth.getUser();
  logger(user.data.user?.id, 'userID from auth');

  const { data, error } = await supabase
    .from('workouts')
    .insert([{ name: 'New Workout', userid, status: 'active' }])
    .select('id');
  if (error) {
    throw error;
  }
  return data[0].id;
};

export async function getActiveWorkout(workout_id: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workout_id)
    .single();

  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function getWorkoutItems(workout_id: string) {
  const { data, error } = await supabase
    .from('workout_items')
    .select('*')
    .eq('workout_id', workout_id);
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function getWorkoutItem(workout_item_id: string) {
  const { data, error } = await supabase
    .from('workout_item')
    .select('*')
    .eq('id', workout_item_id)
    .single();
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function getSets(workout_item_id: string) {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('workout_item_id', workout_item_id);
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function getSet(setId: string) {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('id', setId)
    .single();
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function getExercise(exerciseId: string | number) {
  if (cache.exercises[exerciseId]) {
    return cache.exercises[exerciseId];
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*, muscles(*), exercise_categories(*)')
    .eq('id', exerciseId)
    .single();
  if (error || !data) {
    throw error || new Error(`No data for exercise ${exerciseId}`);
  }
  cache.exercises[exerciseId] = data;
  return data;
}

export async function getExerciseCategory(exerciseCategoryId: string | number) {
  if (cache.exerciseCategories[exerciseCategoryId]) {
    return cache.exerciseCategories[exerciseCategoryId];
  }

  const { data, error } = await supabase
    .from('exercise_categories')
    .select('*')
    .eq('id', exerciseCategoryId)
    .single();

  if (error || !data) {
    throw (
      error || new Error(`No data for exercise category ${exerciseCategoryId}`)
    );
  }

  // Save to cache
  cache.exerciseCategories[exerciseCategoryId] = data;

  return data;
}

export async function getMuscle(muscleId: string) {
  // Check if the data is in the cache
  if (cache.muscles[muscleId]) {
    return cache.muscles[muscleId];
  }

  const { data, error } = await supabase
    .from('muscles')
    .select('*')
    .eq('id', muscleId)
    .single();

  if (error || !data) {
    throw error || new Error(`No data for muscle ${muscleId}`);
  }

  // Save to cache
  cache.muscles[muscleId] = data;

  return data;
}

export async function getRecords(userId: string) {
  const { data, error } = await supabase
    .from('records')
    .select('*, sets(*)')
    .eq('user_id', userId);
  logger(data, 'data');

  if (error) {
    logger(error, 'error');
    return { success: false, error: error?.message || 'Error getting records' };
  }
  return { success: true, data: data || [] };
}

export async function getFilledWorkout(workout_id: string | number) {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      '*, workout_items(*, exercises(*, muscles(*), exercise_categories(*)), sets(*))'
    )
    .eq('id', workout_id)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || 'Error getting workout' };
  }

  // Get previous sets
  const workoutItems = data?.workout_items || [];
  const exerciseIds = workoutItems.map((workoutItem) => workoutItem.exerciseid);
  const { data: previousSets, error: previousSetsError } = await supabase.rpc(
    'get_latest_finished_sets',
    { user_id: data.userid, exercise_ids: exerciseIds }
  );
  if (previousSetsError) {
    logger(previousSetsError, 'error getting previous sets');
    return {
      success: false,
      error: previousSetsError?.message || 'Error getting previous sets',
    };
  }

  // Add previous sets to workout items
  const workoutItemsWithPreviousSets = workoutItems.map((workoutItem) => {
    const previousSetsForWorkoutItem =
      previousSets?.filter(
        (previousSet) => previousSet.exercise_id === workoutItem.exerciseid
      ) || [];
    const sets = workoutItem.sets.map((set) => {
      const previousSet = previousSetsForWorkoutItem.find(
        (previousSet) => previousSet.position === set.position
      );
      if (previousSet) {
        return { ...set, previous_set: previousSet };
      }
      return set;
    });
    return { ...workoutItem, sets };
  });

  const filledWorkout = {
    ...data,
    workout_items: workoutItemsWithPreviousSets,
  };

  return { success: true, data: filledWorkout };
}

export async function getExercises(userid?: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, muscles(*), exercise_categories(*)');
  if (error || !data) {
    logger(error || 'No data');
  }
  if (userid) {
    const { data: amountData, error: amountError } = await supabase
      .from('exercise_count')
      .select('*')
      .eq('user_id', userid);
    if (amountError || !amountData) {
      logger(amountError || 'No data');
    }
    // Add amount of times performed to exercise
    const exercisesWithAmount = data?.map((exercise) => {
      const amount =
        amountData?.find((amount) => amount.id === exercise.id)?.amount || 0;
      return { ...exercise, amount_of_times_performed: amount };
    });
    return exercisesWithAmount;
  } else {
    // Set amount of times performed to 0
    const exercisesWithAmount = data?.map((exercise) => {
      return { ...exercise, amount_of_times_performed: 0 };
    });

    return exercisesWithAmount;
  }
}

export async function getAllMuscles() {
  const { data, error } = await supabase.from('muscles').select('*');
  if (error || !data) {
    return { success: false, error: error?.message || 'Error getting muscles' };
  }
  return { success: true, data };
}

export async function getAllExerciseCategories() {
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('*');
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
}

export async function createNewWorkoutItems(
  workout_id: number,
  exercises: DBExercise[],
  is_finished: boolean,
  positionInWorkout?: number,
  amountOfSets?: number
) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  if (!userId) {
    throw new Error('No user id found');
  }

  // If no position is given, get the highest position and add 1
  if (!positionInWorkout) {
    const { data, error } = await supabase
      .from('workout_items')
      .select('position')
      .eq('workout', workout_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      logger('Error when trying to get position');
      logger(error || 'No data');
      positionInWorkout = 1;
    }
    if (!data) {
      positionInWorkout = 1;
    } else {
      positionInWorkout = data.position + 1;
    }
  }

  let pos = positionInWorkout || 1;

  const { data, error } = await supabase
    .from('workout_items')
    .insert(
      exercises.map((exercise) => ({
        workout: workout_id,
        exerciseid: exercise.id,
        is_finished,
        position: pos++,
      }))
    )
    .select();

  if (error || !data || !data[0]) {
    logger('Error when trying to insert workout items');
    logger(error || 'No id returned');
    return null;
  }

  // insert sets for each workout item

  const sets: DBInsertSet[] = [];
  data.forEach((workoutItem) => {
    // If no amount of sets is given, get the default amount of sets for the exercise
    if (!amountOfSets) {
      amountOfSets = 3;
    }
    for (let i = 0; i < amountOfSets; i++) {
      sets.push({
        userid: userId,
        workout_item_id: workoutItem.id,
        is_finished: false,
        workout_id: workout_id,
      });
    }
  });

  const { error: setsError } = await supabase.from('sets').insert(sets.flat());
  if (setsError) {
    logger(setsError || 'No sets id returned');
    return null;
  }

  const workout_item_ids = data.map((workoutItem) => workoutItem.id);

  const { data: workoutItemToReturn, error: workoutItemToReturnError } =
    await supabase
      .from('workout_items')
      .select('*, exercises(*, muscles(*), exercise_categories(*)), sets(*)')
      .in('id', workout_item_ids);

  if (workoutItemToReturnError || !workoutItemToReturn) {
    logger(workoutItemToReturnError || 'No workoutitem id returned');
    return null;
  }

  logger(workoutItemToReturn, 'workout items that i am returning');
  return workoutItemToReturn as WorkoutItem[];
}

export const updateSetInDB = async (
  setId: string | number,
  update: Set
): Promise<SupabaseUtilReturnType<DBSet>> => {
  const updateSet: UpdateSet = {
    weight: update.weight,
    reps: update.reps,
    distance: update.distance,
    speed: update.speed,
    is_finished: update.is_finished,
    workout_item_id: update.workout_item_id,
    workout_id: update.workout_id,
    position: update.position,
  };

  const { data, error } = await supabase
    .from('sets')
    .update(updateSet)
    .eq('id', setId)
    .select()
    .single();
  if (error) {
    logger(error, 'error updating set');
    return {
      success: false,
      error: error.message,
    };
  }
  if (!data) {
    logger('No data');
    return {
      success: false,
      error: 'No data',
    };
  }
  return {
    success: true,
    data,
  };
};

export const addNewSet = async (
  workout_id: number,
  workout_item_id: number
) => {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (!userId) {
    throw new Error('No user id found! User may not be logged in');
  }
  logger(workout_id, 'workout_id');
  logger(workout_item_id, 'workout_item_id');
  const { data, error } = await supabase
    .from('sets')
    .insert({
      workout_id: workout_id,
      workout_item_id,
      userid: userId,
      is_finished: false,
    })
    .select('*, workout_items(*)')
    .single();
  if (error || !data) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error adding set' };
  }

  if (
    data.workout_items?.exerciseid === null ||
    data.workout_items?.exerciseid === undefined
  ) {
    logger('No exercise id found');
    return { success: false, error: 'No exercise id found' };
  }
  // Get previous set
  const { data: previousSet, error: previousSetError } = await supabase.rpc(
    'get_latest_finished_sets',
    { user_id: userId, exercise_ids: [data.workout_items.exerciseid] }
  );
  if (previousSetError) {
    logger(previousSetError || 'No data');
  }
  logger(previousSet, 'previous set');

  // Get Previous set that matches position
  if (!previousSet) {
    return { success: true, data };
  }
  const previousSetForPosition = previousSet.find(
    (previousSet) => previousSet.position === data.position
  );
  if (!previousSetForPosition) {
    return { success: true, data };
  }
  const set = { ...data, previous_set: previousSetForPosition };
  return { success: true, data: set };
};

export const deleteSetInDB = async (setId: number) => {
  const { data, error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error deleting set' };
  }
  return { success: true, data };
};

export const deleteWorkoutIteminDB = async (workout_item_id: number) => {
  logger(workout_item_id, 'Delete for workout item');
  const { data, error } = await supabase
    .from('workout_items')
    .delete()
    .eq('id', workout_item_id);
  if (error) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error deleting workout item',
    };
  }
  return { success: true, data };
};

export const updateWorkoutItem = async (workoutItem: DBWorkoutItem) => {
  const { data, error } = await supabase
    .from('workout_items')
    .update(workoutItem)
    .eq('id', workoutItem.id)
    .single();
  if (error || !data) {
    logger(error.message || 'No data');
    return;
  }
  return data;
};

export const deleteWorkoutItem = async (workout_item_id: number) => {
  const { data, error } = await supabase
    .from('workout_items')
    .delete()
    .eq('id', workout_item_id);
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
};

export const updateWorkoutInDB = async (
  update: Partial<DBUpdateWorkout>,
  id: number
) => {
  logger(update, 'update workout');
  logger(id, 'id');
  const { data, error } = await supabase
    .from('workouts')
    .update(update)
    .eq('id', id);
  if (error) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error updating workout',
    };
  }
  return { success: true, data };
};

export const finishWorkoutInDB = async (workout_id: number) => {
  const { data, error } = await supabase
    .from('workouts')
    .update({ status: 'finished' })
    .eq('id', workout_id);
  if (error) {
    logger(error);
    return {
      success: false,
      error: error?.message || 'Error finishing workout',
    };
  }
  return { success: true, data };
};

export const getWorkout = async (workout_id: number) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workout_id)
    .single();
  if (error || !data) {
    logger(error || 'No data');
  }
  return data;
};

export const getRecordsForExercise = async (
  exerciseId: number,
  userId: string
) => {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId);
  if (error || !data) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error getting records' };
  }
  return { success: true, data };
};

export const getPlannedWorkouts = async (userId: string) => {
  const { data, error } = await supabase
    .from('calendar')
    .select('*')
    .gte('date', new Date().toISOString())
    .eq('user_id', userId);
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error getting planned workouts',
    };
  }
  return { success: true, data };
};

export const addPlannedWorkout = async (date: string) => {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (!userId) {
    throw new Error('No user id found! User may not be logged in');
  }
  const { data, error } = await supabase
    .from('calendar')
    .insert({ user_id: userId, date: date, type: 'workout' })
    .select()
    .single();
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error adding planned workout',
    };
  }
  return { success: true, data };
};

export const removePlannedWorkout = async (id: number) => {
  const { data, error } = await supabase.from('calendar').delete().eq('id', id);
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error removing planned workout',
    };
  }
  return { success: true, data };
};

export const addExercise = async (
  exercise: DBInsertExercise,
  muscleIds: number[]
) => {
  logger(exercise, 'exercise');
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  // Insert muscle Relations
  if (error || !data) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error adding exercise' };
  }

  const { error: muscleError } = await supabase.from('exercisemuscles').insert(
    muscleIds.map((muscleId) => ({
      exerciseid: data?.id,
      muscleid: muscleId,
    }))
  );

  if (muscleError) {
    logger(muscleError);
    return {
      success: false,
      error: muscleError?.message || 'Error adding exercise',
    };
  }
  const filledExercise = await getExercise(data.id);
  return { success: true, data: filledExercise };
};

const workoutItemsToTemplateItems = (
  workoutItems: WorkoutItem[],
  templateId: number
): DBInsertTemplateItem[] => {
  const templateItems: DBInsertTemplateItem[] = [];
  workoutItems.forEach((workoutItem) => {
    templateItems.push({
      template_id: templateId,
      exercise_id: workoutItem.exerciseid,
      position: workoutItem.position,
      amount_of_sets: workoutItem.sets.length,
    });
  });
  return templateItems;
};

export const saveAsTemplateToDB = async (workout: Workout, name: string) => {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  if (!userId) {
    throw new Error('No user id found! User may not be logged in');
  }

  const Template: DBInsertTemplate = {
    name,
    userid: userId,
    main_muscle: workout.mainmuscle,
    last_performed: new Date().toDateString(),
    amount_of_times_performed: 1,
    public: false,
  };

  const { data, error } = await supabase
    .from('templates')
    .insert(Template)
    .select('id')
    .single();

  if (error || !data || !data.id) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error saving template' };
  }

  const templateId = data.id;

  const template_items = workoutItemsToTemplateItems(
    workout.workout_items,
    templateId
  );

  const { error: templateItemError } = await supabase
    .from('template_items')
    .insert(template_items);

  if (templateItemError) {
    logger(templateItemError || 'No data');
    return {
      success: false,
      error: templateItemError?.message || 'Error saving template',
    };
  }

  return { success: true };
};

export const loadTemplatesFromDB = async () => {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  const { data, error } = await supabase
    .from('templates')
    .select(
      '*, owner: userprofile(*), main_muscle_filled: muscles(*), template_items: template_items(*, exercise: exercises(*, muscles(*), exercise_categories(*)))'
    )
    .or(`userid.eq.${userId}, public.eq.true`);
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading templates',
    };
  }
  return { success: true, data };
};

export const updateTemplateName = async (templateId: number, name: string) => {
  const { data, error } = await supabase
    .from('templates')
    .update({ name })
    .eq('id', templateId);
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error updating template name',
    };
  }
  return { success: true, data };
};

export const loadTemplateFromDB = async (templateId: number) => {
  const { data, error } = await supabase
    .from('templates')
    .select(
      '*, template_items: template_items(*, exercise: exercises(*, muscles(*), exercise_categories(*)))'
    )
    .eq('id', templateId)
    .single();
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading template',
    };
  }
  return { success: true, data };
};

export const newWorkoutFromTemplate = async (
  userid: string,
  templateid: number
) => {
  logger(userid, 'userid');

  const templateData = await loadTemplateFromDB(templateid);
  const template = templateData.data;
  if (!template) {
    return { success: false, error: 'No template found' };
  }

  const user = await supabase.auth.getUser();
  logger(user.data.user?.id, 'userID from auth');

  const { data, error } = await supabase
    .from('workouts')
    .insert([
      {
        name:
          template.name +
          ' - ' +
          formatISO(new Date(), { representation: 'date', format: 'basic' }),
        userid,
        status: 'active',
        template_id: templateid,
      },
    ])
    .select('id');

  if (error) {
    return {
      success: false,
      error: error?.message || 'Error creating new workout',
    };
  }

  const workout_id = data[0].id;
  const dateText = formatISO(new Date(), { representation: 'date' });
  const workoutName = template.name + ' - ' + dateText;

  const workout_items = template.template_items.map((template_item) => {
    if (!template_item.exercise) {
      throw new Error('No exercise found for template item');
    }
    return {
      exerciseid: template_item.exercise.id,
      position: template_item.position,
      workout: workout_id,
    };
  });

  logger(workout_items, 'workout items');

  const updateNameRes = await updateWorkoutInDB(
    { name: workoutName },
    workout_id
  );

  if (!updateNameRes.success) {
    return { success: false, error: updateNameRes.error };
  }

  const { data: workoutItemData, error: workoutItemsError } = await supabase
    .from('workout_items')
    .insert(workout_items)
    .select('*');

  if (workoutItemsError) {
    return {
      success: false,
      error: workoutItemsError?.message || 'Error creating new workout',
    };
  }

  const workoutItems = workoutItemData || [];

  workoutItems.forEach(async (workoutItem) => {
    const sets: DBInsertSet[] = [];
    const template_item = template.template_items.find(
      (template_item) => template_item.exercise?.id === workoutItem.exerciseid
    );
    if (!template_item) {
      throw new Error('No template item found');
    }
    const amountOfSet = template_item.amount_of_sets || 3;
    for (let i = 0; i < amountOfSet; i++) {
      sets.push({
        userid: userid,
        workout_item_id: workoutItem.id,
        is_finished: false,
        workout_id: workout_id,
      });
    }
    const { error: setsError } = await supabase
      .from('sets')
      .insert(sets.flat());
    if (setsError) {
      logger(setsError || 'No sets id returned');
      return {
        success: false,
        error: setsError?.message || 'Error creating new workout',
      };
    }
  });

  return { success: true, data: workout_id };
};

export const loadFinishedWorkouts = async (userId: string) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('userid', userId)
    .eq('status', 'finished')
    .order('created_at', { ascending: false });
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading workouts',
    };
  }
  return { success: true, data };
};

export const loadPreviousSetsForWorkoutItems = async (
  userId: string,
  workoutItems: WorkoutItem[]
) => {
  const exerciseIds = workoutItems.map((workoutItem) => workoutItem.exerciseid);
  const { data, error } = await supabase.rpc('get_latest_finished_sets', {
    user_id: userId,
    exercise_ids: exerciseIds,
  });
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading previous sets',
    };
  }
  return { success: true, data };
};

export const loadPreviousSetsForWorkoutItem = async (
  userId: string,
  workoutItem: WorkoutItem
) => {
  const { data, error } = await supabase.rpc('get_latest_finished_sets', {
    user_id: userId,
    exercise_ids: [workoutItem.exerciseid],
  });
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading previous sets',
    };
  }
  return { success: true, data };
};

export const loadLevelXp = async () => {
  const { data, error } = await supabase.from('experience_level').select('*');
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading level xp',
    };
  }
  return { success: true, data };
};

export const getAllAvailableIcons = async () => {
  const { data, error } = await supabase
    .from('profile_icons')
    .select('*, challenges(hidden)');
  if (error || !data) {
    logger(error || 'No data');
    return { success: false, error: error?.message || 'Error loading icons' };
  }
  return { success: true, data };
};

export const hasActiveWorkout = async (userId: string) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, name')
    .eq('userid', userId)
    .eq('status', 'active')
    .limit(1)
    .single();
  logger(data, 'data');
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading workouts',
    };
  }
  return { success: true, data };
};

export const deleteWorkout = async (workoutId: number) => {
  logger(workoutId, 'workoutId to delete');
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);
  if (error) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error deleting workout',
    };
  }
  return { success: true };
};

export const deleteAllActiveWorkouts = async (userId: string) => {
  const { data, error } = await supabase
    .from('workouts')
    .delete()
    .eq('userid', userId)
    .eq('status', 'active');
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error deleting workout',
    };
  }
  return { success: true, data };
};

export const getTemplate = async (templateId: number) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*, template_items(*)')
    .eq('id', templateId)
    .single();
  if (error || !data) {
    logger(error || 'No data');
    return {
      success: false,
      error: error?.message || 'Error loading template',
    };
  }
  return { success: true, data };
};

export const updateTemplateInDB = async (
  templateId: number,
  workout: Workout
) => {
  logger(templateId, 'Updating template');
  logger(workout.userid, 'userid');
  // Update the template in the db with anything that changed
  const templateItems = workoutItemsToTemplateItems(
    workout.workout_items,
    templateId
  );
  // delete previous template Items
  const { error: deleteTemplateItemsError } = await supabase
    .from('template_items')
    .delete()
    .eq('template_id', templateId);
  if (deleteTemplateItemsError) {
    logger(deleteTemplateItemsError || 'No data');
    return {
      success: false,
      error: deleteTemplateItemsError?.message || 'Error updating template',
    };
  }
  // insert new template items
  const { error: insertTemplateItemsError } = await supabase
    .from('template_items')
    .insert(templateItems);
  if (insertTemplateItemsError) {
    logger(insertTemplateItemsError || 'No data');
    return {
      success: false,
      error: insertTemplateItemsError?.message || 'Error updating template',
    };
  }
  return { success: true };
};
