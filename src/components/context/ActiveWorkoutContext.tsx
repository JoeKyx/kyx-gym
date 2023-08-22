'use client';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

import logger from '@/lib/logger';
import {
  addExercise,
  addNewSet,
  createNewWorkoutItems,
  deleteSetInDB,
  deleteWorkoutIteminDB,
  finishWorkoutInDB,
  getAllExerciseCategories,
  getAllMuscles,
  getExercises,
  getFilledWorkout,
  getRecords,
  loadPreviousSetsForWorkoutItems,
  updateSetInDB,
  updateWorkoutInDB,
} from '@/lib/supabase-util';

import {
  DBCategory,
  DBInsertExercise,
  DBMuscle,
  Exercise,
  Record,
  Set,
  Workout,
  WorkoutItem,
} from '@/types/Workout';

interface IActiveWorkoutContext {
  activeWorkout: Workout | null;
  setActiveWorkout: (workout: Workout) => void;
  loading: boolean;
  availableExercises: Exercise[];
  availableMuscles: DBMuscle[];
  availableCategories: DBCategory[];
  records: Record[];
  updateSet: (set: Set) => Promise<{ success: boolean; message: string }>;
  addSet: (
    workout_item_id: number
  ) => Promise<{ success: boolean; message: string }>;
  deleteSet: (setId: number) => Promise<{ success: boolean; message: string }>;
  addExercisesToWorkout: (
    exercises: Exercise[]
  ) => Promise<{ success: boolean; message: string }>;
  updateWorkoutName: (
    name: string
  ) => Promise<{ success: boolean; message: string }>;
  finishWorkout: () => Promise<{ success: boolean; message: string }>;
  createNewExercise: (
    exercise: DBInsertExercise,
    muscles: number[]
  ) => Promise<{ success: boolean; message: string }>;
  loadingExercises: number | null;
  deleteWorkoutItem: (
    workout_item_id: number
  ) => Promise<{ success: boolean; message: string }>;
}

const initialActiveWorkoutContext: IActiveWorkoutContext = {
  activeWorkout: null,
  setActiveWorkout: () => {
    logger('I am a placeholder function (setActiveWorkout)');
  },
  loading: true,
  availableExercises: [],
  availableMuscles: [],
  availableCategories: [],
  records: [],
  addExercisesToWorkout: async () => {
    return { success: false, message: 'Error adding exercises to workout' };
  },
  updateSet: async () => {
    return { success: false, message: 'Error updating set' };
  },
  addSet: async () => {
    return { success: false, message: 'Error adding set to workout' };
  },
  deleteSet: async () => {
    return { success: false, message: 'Error deleting set from workout' };
  },
  updateWorkoutName: async () => {
    return { success: false, message: 'Error updating workout name' };
  },
  finishWorkout: async () => {
    return { success: false, message: 'Error finishing workout' };
  },
  createNewExercise: async () => {
    return { success: false, message: 'Error creating new exercise' };
  },
  deleteWorkoutItem: async () => {
    return { success: false, message: 'Error deleting workout item' };
  },
  loadingExercises: null,
};

export const ActiveWorkoutContext = createContext(initialActiveWorkoutContext);

export function ActiveWorkoutProvider({
  children,
  workout_id,
}: {
  children: ReactNode;
  workout_id: string | number;
}) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMuscles, setAvailableMuscles] = useState<DBMuscle[]>([]);
  const [availableCategories, setAvailableCategories] = useState<DBCategory[]>(
    []
  );
  const [records, setRecords] = useState<Record[]>([]);
  const [loadingExercises, setLoadingExercises] = useState<number>(0);
  const [_error, setError] = useState<string | null>(null);

  // timer is the time in seconds since the workout started

  useEffect(() => {
    if (!workout_id) return;
    const loadData = async () => {
      logger('Loading workout');
      const filledWorkout = await getFilledWorkout(workout_id);
      if (!filledWorkout.success || !filledWorkout.data) {
        setError(filledWorkout.error || 'Error loading workout');
        return;
      }
      setActiveWorkout(filledWorkout.data);
      setLoading(false);
    };
    loadData();
  }, [setActiveWorkout, workout_id]);

  useEffect(() => {
    if (!activeWorkout) return;
    const loadData = async () => {
      const exercises = await getExercises();
      if (!exercises) return;
      setAvailableExercises(exercises);
    };
    loadData();
  }, [activeWorkout]);

  useEffect(() => {
    if (!availableExercises) return;
    const loadMuscles = async () => {
      const muscles = await getAllMuscles();
      if (muscles.success) {
        setAvailableMuscles(muscles.data ? muscles.data : []);
      } else {
        setError(muscles.error || 'Error loading muscles');
      }
    };
    const loadCategories = async () => {
      const categories = await getAllExerciseCategories();
      setAvailableCategories(categories ? categories : []);
    };
    Promise.all([loadMuscles(), loadCategories()]);
  }, [availableExercises]);

  useEffect(() => {
    if (!activeWorkout?.userid) return;
    const loadRecords = async () => {
      const records = await getRecords(activeWorkout.userid);
      if (records.success) {
        setRecords(records.data ? records.data : []);
      } else {
        setError(records.error || 'Error loading records');
      }
    };
    loadRecords();
  }, [activeWorkout?.userid]);

  const addExercisesToWorkout = async (exercises: Exercise[]) => {
    if (!activeWorkout)
      return { success: false, message: 'There seems to be no active Workout' };
    setLoadingExercises(exercises.length);
    const workoutItems = await createNewWorkoutItems(
      activeWorkout.id,
      exercises,
      false,
      activeWorkout.workout_items.length
    );
    if (!workoutItems) {
      return {
        success: false,
        message: 'Error adding exercises to workout Code (1)',
      };
    }
    logger(workoutItems, 'workoutItems that i want to add');

    // Load previous sets
    const previousSetRes = await loadPreviousSetsForWorkoutItems(
      activeWorkout.userid,
      workoutItems
    );
    if (previousSetRes.success) {
      logger(previousSetRes.data, 'previousSetRes.data');
      workoutItems.forEach((workoutItem) => {
        workoutItem.sets.forEach((set) => {
          logger(set, 'set');
          const previousSet = previousSetRes.data?.find(
            (previousSet) =>
              previousSet.exercise_id === workoutItem.exerciseid &&
              previousSet.position === set.position
          );
          if (previousSet) {
            set.previous_set = previousSet;
          }
        });
      });
    }

    addWorkoutItems(workoutItems);
    logger('Setting loading Exercises to 0');
    setLoadingExercises(0);
    return {
      success: true,
      message: 'Successfully added exercises to workout',
    };
  };

  const addSet = async (workout_item_id: number) => {
    const newSetRes = await addNewSet(
      workout_id as number,
      workout_item_id as number
    );
    if (!newSetRes.success || !newSetRes.data) {
      return { success: false, message: 'Error adding set to workout' };
    }
    const newSet = newSetRes.data;
    logger(newSet, 'newSet');
    if (!activeWorkout)
      return { success: false, message: 'Error adding set to workout' };

    setActiveWorkout((prevWorkout) => {
      if (!prevWorkout) return null;
      const newWorkout = { ...prevWorkout };
      const newWorkoutItems = newWorkout?.workout_items?.map((item) => {
        if (item.id === workout_item_id) {
          return { ...item, sets: [...item.sets, newSet] };
        } else {
          return item;
        }
      });
      newWorkout.workout_items = newWorkoutItems;
      return newWorkout;
    });
    return { success: true, message: 'Successfully added set to workout' };
  };

  const deleteSet = async (setId: number) => {
    if (!activeWorkout)
      return { success: false, message: 'Error deleting set from workout' };
    let lastSet = false;
    let workout_item_id: number | null = null;
    const newWorkout = { ...activeWorkout };
    let newWorkoutItems = newWorkout.workout_items.map((item) => {
      // Get the workout_item_id and filter out the set
      const setItems = item.sets.filter((set) => {
        if (set.id === setId) {
          workout_item_id = item.id;
          return false;
        } else return true;
      });
      if (setItems.length === 0) {
        lastSet = true;
      }
      return { ...item, sets: setItems };
    });
    if (lastSet) {
      newWorkoutItems = newWorkoutItems.filter((item) => item.sets.length > 0);
    }

    newWorkout.workout_items = newWorkoutItems;
    setActiveWorkout(newWorkout);

    // Update workout in DB
    const resSet = await deleteSetInDB(setId);
    if (lastSet && workout_item_id) {
      const resWorkoutItem = await deleteWorkoutIteminDB(workout_item_id);
      if (resWorkoutItem.success)
        return { success: true, message: 'Successfully deleted workout item' };
      else {
        setError(resWorkoutItem.error || 'Error deleting workout item');
        return { success: false, message: 'Error deleting workout item' };
      }
    }
    if (resSet.success)
      return { success: true, message: 'Successfully deleted set' };
    else {
      setError(resSet.error || 'Error deleting set');
      return { success: false, message: 'Error deleting set' };
    }
  };

  const deleteWorkoutItem = async (workout_item_id: number) => {
    if (!activeWorkout)
      return {
        success: false,
        message: 'Error deleting workout item, no active Workout',
      };
    const newWorkout = { ...activeWorkout };
    const newWorkoutItems = newWorkout.workout_items.filter(
      (item) => item.id !== workout_item_id
    );
    newWorkout.workout_items = newWorkoutItems;
    setActiveWorkout(newWorkout);
    // Update workout in DB
    const res = await deleteWorkoutIteminDB(workout_item_id);
    if (res.success)
      return { success: true, message: 'Successfully deleted workout item' };
    else {
      setError(res.error || 'Error deleting workout item');
      return { success: false, message: 'Error deleting workout item' };
    }
  };

  const addWorkoutItems = (workoutItems: WorkoutItem[]) => {
    if (!activeWorkout) {
      logger('No active workout');
      return null;
    }
    setActiveWorkout((prevWorkout) => {
      if (!prevWorkout) {
        logger('No previous workout');
        return null;
      } else {
        logger(workoutItems, 'workoutItems that i am adding');
        return {
          ...prevWorkout,
          workout_items: [...prevWorkout.workout_items, ...workoutItems],
        };
      }
    });
  };

  const updateSet = async (set: Set) => {
    logger(set, 'updating set');
    if (!activeWorkout)
      return { success: false, message: 'Error updating set' };
    const newWorkout = { ...activeWorkout };
    const newWorkoutItems = newWorkout.workout_items.map((item) => {
      const setItems = item.sets.map((itemSet) => {
        if (itemSet.id === set.id) {
          return set;
        } else {
          return itemSet;
        }
      });
      return { ...item, sets: setItems };
    });
    newWorkout.workout_items = newWorkoutItems;

    setActiveWorkout(newWorkout);

    // Update workout in DB
    const res = await updateSetInDB(set.id, set);
    if (res.success)
      return { success: true, message: 'Successfully updated set' };
    else {
      setError(res.error);
      return { success: false, message: 'Error updating set' };
    }
  };

  const updateWorkoutName = async (name: string) => {
    if (!activeWorkout)
      return { success: false, message: 'Error updating workout name' };
    const newWorkout = { ...activeWorkout };
    newWorkout.name = name;
    setActiveWorkout(newWorkout);
    // Update workout in DB
    const res = await updateWorkoutInDB({ name }, workout_id as number);
    if (res.success)
      return { success: true, message: 'Successfully updated workout name' };
    else {
      setError(res.error || 'Error updating workout name');
      return { success: false, message: 'Error updating workout name' };
    }
  };

  const finishWorkout = async () => {
    if (!activeWorkout)
      return { success: false, message: 'Error finishing workout' };
    logger(activeWorkout, 'Finishing Workout:');
    const newWorkout = { ...activeWorkout };
    newWorkout.status = 'finished';

    setActiveWorkout(newWorkout);
    const res = await finishWorkoutInDB(workout_id as number);
    if (res.success) {
      return {
        success: true,
        message: 'Successfully finished workout',
        id: activeWorkout.id,
      };
    } else {
      logger(res.error, 'Error finishing workout');
      setError(res.error || 'Error finishing workout');
      return { success: false, message: 'Error finishing workout' };
    }
  };

  const createNewExercise = async (
    exercise: DBInsertExercise,
    muscles: number[]
  ) => {
    const res = await addExercise(exercise, muscles);
    if (res.success && res.data) {
      setAvailableExercises((prev) => [...prev, res.data]);
      return { success: true, message: 'Successfully added exercise' };
    } else {
      setError(res.error || 'Error adding exercise');
      return { success: false, message: 'Error adding exercise' };
    }
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        setActiveWorkout,
        loading,
        loadingExercises,
        deleteWorkoutItem,
        createNewExercise,
        availableExercises,
        availableCategories,
        availableMuscles,
        addExercisesToWorkout,
        updateSet,
        addSet,
        deleteSet,
        updateWorkoutName,
        finishWorkout,
        records,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = React.useContext(ActiveWorkoutContext);
  if (context === undefined) {
    throw new Error(
      'useActiveWorkout must be used within a ActiveWorkoutProvider'
    );
  }
  return context;
}

// export function useActiveWorkoutSubscription(workout_id: string) {

// TODO: Add Realtime Subscription,
// this will allow us to update the workout in real time (spectators)

// }
