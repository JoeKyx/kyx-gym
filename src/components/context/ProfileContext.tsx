'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isToday, isYesterday } from 'date-fns';
import differenceInDays from 'date-fns/differenceInDays';
import startOfDay from 'date-fns/startOfDay';
import { forEach } from 'lodash';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import logger from '@/lib/logger';
import {
  addPlannedWorkout,
  getAllMuscles,
  getPlannedWorkouts,
  removePlannedWorkout,
  updateWorkoutInDB,
} from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import { UserProfile } from '@/components/context/SocialContext';

import { Database } from '@/types/supabase';
import { DBCalendar, DBMuscle, DBWorkout } from '@/types/Workout';

type IProfile = {
  isFriend: boolean;
  isOwn: boolean;
  workouts: DBWorkout[];
  userProfile: UserProfile;
  favoriteMuscle: DBMuscle | null;
  longestStreak: number;
  currentStreak: number;
  plannedWorkouts: DBCalendar[];
  muscleResolver: (muscleId: number) => string;
  updateWorkoutName: (
    name: string,
    workout_id: string | number
  ) => Promise<void>;
  planWorkout: (date: Date) => Promise<void>;
  removeCalendarEntry: (id: number) => Promise<void>;
};

// Define the action structure
type ProfileAction = {
  type: string;
  payload?: unknown;
};

// Define the initial state
const initialProfile: IProfile = {
  isFriend: false,
  isOwn: false,
  workouts: [],
  userProfile: null as unknown as UserProfile,
  favoriteMuscle: null,
  longestStreak: 0,
  currentStreak: 0,
  muscleResolver: () => '',
  updateWorkoutName: async () => {
    throw new Error('Using updateWorkoutName out of Context');
  },
  plannedWorkouts: [],
  planWorkout: async () => {
    throw new Error('Using planWorkout out of Context');
  },
  removeCalendarEntry: async () => {
    throw new Error('Using removeCalendarEntry out of Context');
  },
};

// Create context
const ProfileContext = createContext(initialProfile);

// Create reducer
function ProfileReducer(state: IProfile, action: ProfileAction): IProfile {
  switch (action.type) {
    case 'setIsFriend':
      return { ...state, isFriend: action.payload as boolean };
    case 'setIsOwn':
      return { ...state, isOwn: action.payload as boolean };
    case 'setWorkouts':
      return { ...state, workouts: action.payload as DBWorkout[] };
    case 'setUserProfile':
      return { ...state, userProfile: action.payload as UserProfile };
    case 'setFavoriteMuscle':
      return { ...state, favoriteMuscle: action.payload as DBMuscle };
    case 'setLongestStreak':
      return { ...state, longestStreak: action.payload as number };
    case 'setCurrentStreak':
      return { ...state, currentStreak: action.payload as number };
    case 'setPlannedWorkouts':
      return { ...state, plannedWorkouts: action.payload as DBCalendar[] };
    case 'changePlannedWorkout': {
      const newPlannedWorkouts = [...state.plannedWorkouts];
      const payload = action.payload as { id: number; plan: DBCalendar };
      const plannedWorkoutIndex = newPlannedWorkouts.findIndex(
        (plannedWorkout) => plannedWorkout.id === payload.id
      );
      if (plannedWorkoutIndex !== -1) {
        newPlannedWorkouts[plannedWorkoutIndex] = payload.plan;
        return { ...state, plannedWorkouts: newPlannedWorkouts };
      } else {
        return state;
      }
    }
    default:
      return state;
  }
}

// Create Provider
export function ProfileProvider({
  children,
  userProfile,
  workouts,
}: {
  children: ReactNode;
  userProfile: UserProfile;
  workouts: DBWorkout[];
}) {
  const [state, dispatch] = useReducer(ProfileReducer, initialProfile);
  const [_hasError, setHasError] = useState(false);
  const [_errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allMuscles, setAllMuscles] = useState<DBMuscle[] | null>(null);

  const socialContext = useSocial();

  useEffect(() => {
    const loadAllMuscles = async () => {
      const { data, error } = await getAllMuscles();
      if (error) {
        setHasError(true);
        setErrorMessage(error);
      } else {
        setAllMuscles(data || []);
      }
    };
    loadAllMuscles();
  }, []);

  useEffect(() => {
    const loadAllPlannedWorkouts = async () => {
      const { data, error } = await getPlannedWorkouts(userProfile.userid);
      if (error) {
        setHasError(true);
        setErrorMessage(error);
      } else {
        dispatch({ type: 'setPlannedWorkouts', payload: data });
      }
    };
    loadAllPlannedWorkouts();
  }, [userProfile.userid]);

  useEffect(() => {
    forEach(socialContext?.friendlist, (friend) => {
      if (friend.userid === userProfile.userid) {
        dispatch({ type: 'setIsFriend', payload: true });
      }
    });
  }, [socialContext?.friendlist, userProfile.userid]);

  useEffect(() => {
    if (socialContext?.userProfile?.userid === userProfile.userid) {
      dispatch({ type: 'setIsOwn', payload: true });
    }
  }, [socialContext?.userProfile, userProfile.userid]);

  useEffect(() => {
    dispatch({ type: 'setWorkouts', payload: workouts });
    dispatch({ type: 'setUserProfile', payload: userProfile });
  }, [workouts, userProfile]);

  useEffect(() => {
    const muscleCounts: { [key: number]: number } = {};
    workouts.forEach((workout) => {
      const muscle = workout.mainmuscle;
      if (muscle) {
        if (muscleCounts[muscle]) {
          muscleCounts[muscle] += 1;
        } else {
          muscleCounts[muscle] = 1;
        }
      }
    });
    let favoriteMuscleId: number | null = null;
    let favoriteMuscleCount = 0;
    for (const [key, value] of Object.entries(muscleCounts)) {
      if (value > favoriteMuscleCount) {
        favoriteMuscleCount = value;
        favoriteMuscleId = parseInt(key);
      }
    }
    if (favoriteMuscleId) {
      const loadMuscle = async () => {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('muscles')
          .select('*')
          .eq('id', favoriteMuscleId)
          .single();
        if (error) {
          setHasError(true);
          setErrorMessage(error.message);
        } else {
          dispatch({ type: 'setFavoriteMuscle', payload: data });
        }
      };
      loadMuscle();
    }
  }, [workouts]);

  useEffect(() => {
    // Extract unique workout days
    const uniqueWorkoutDays = new Set<string>();
    workouts.forEach((workout) =>
      uniqueWorkoutDays.add(
        startOfDay(new Date(workout.created_at)).toISOString()
      )
    );

    // Convert to Date objects and sort
    const sortedUniqueWorkoutDays = Array.from(uniqueWorkoutDays)
      .map((date) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    // Iterate through the sorted unique workout days and calculate the streaks
    sortedUniqueWorkoutDays.forEach((date) => {
      if (lastDate) {
        const diffInDays = differenceInDays(date, lastDate);
        if (diffInDays === 1) {
          currentStreak += 1;
        } else {
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          currentStreak = 0;
        }
      }
      lastDate = date;
    });

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    dispatch({ type: 'setLongestStreak', payload: longestStreak });
  }, [workouts]);

  useEffect(() => {
    // Extract unique workout days
    const uniqueWorkoutDays = new Set<string>();
    workouts.forEach((workout) =>
      uniqueWorkoutDays.add(
        startOfDay(new Date(workout.created_at)).toISOString()
      )
    );

    // Convert to Date objects and sort
    const sortedUniqueWorkoutDays = Array.from(uniqueWorkoutDays)
      .map((date) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    let currentStreak = 0;

    // Iterate through the sorted unique workout days
    for (let i = sortedUniqueWorkoutDays.length - 1; i >= 0; i--) {
      const date = sortedUniqueWorkoutDays[i];

      if (isToday(date) || isYesterday(date)) {
        currentStreak += 1;
      } else {
        const previousDate = sortedUniqueWorkoutDays[i + 1];
        const diffInDays = differenceInDays(date, previousDate);

        // Check if dates are consecutive
        if (diffInDays === 1) {
          currentStreak += 1;
        } else {
          // Exit loop if dates are not consecutive
          break;
        }
      }
    }

    dispatch({ type: 'setCurrentStreak', payload: currentStreak });
  }, [workouts]);

  const muscleResolver = (muscleId: number) => {
    logger(muscleId, 'Muscle ID');
    if (allMuscles) {
      const muscle = allMuscles.find((muscle) => muscle.id === muscleId);
      if (muscle) {
        logger(muscle, 'Muscle');
        return muscle.name;
      } else {
        return 'Unknown';
      }
    } else {
      return 'Unknown';
    }
  };

  const updateWorkoutName = async (
    name: string,
    workout_id: string | number
  ) => {
    const newWorkouts = [...state.workouts];
    const workoutIndex = newWorkouts.findIndex(
      (workout) => workout.id === workout_id
    );
    if (workoutIndex !== -1) {
      newWorkouts[workoutIndex].name = name;
      dispatch({ type: 'setWorkouts', payload: newWorkouts });
    }
    await updateWorkoutInDB({ name }, workout_id as number);
  };

  const planWorkout = async (date: Date) => {
    return addCalendarEntry(date, 'workout');
  };

  const addCalendarEntry = async (date: Date, type: 'workout') => {
    logger('Adding planned Workout');
    const newPlannedWorkouts = [...state.plannedWorkouts];
    const randomId = Math.floor(Math.random() * 1000000);
    newPlannedWorkouts.push({
      id: randomId,
      user_id: userProfile.userid,
      date: date.toISOString(),
      public: true,
      type,
      workout_id: null,
      created_at: new Date().toISOString(),
    });
    dispatch({ type: 'setPlannedWorkouts', payload: newPlannedWorkouts });
    logger(newPlannedWorkouts, 'New planned workouts');
    const dbPlannedEntryRes = await addPlannedWorkout(date.toISOString());
    if (dbPlannedEntryRes.success && dbPlannedEntryRes.data) {
      dispatch({
        type: 'changePlannedWorkout',
        payload: { id: randomId, plan: dbPlannedEntryRes.data },
      });
      logger(newPlannedWorkouts, 'New planned workouts after DB');
    }
  };

  const removeCalendarEntry = async (id: number) => {
    logger('Removing planned Workout');
    const newPlannedWorkouts = [...state.plannedWorkouts];
    const plannedWorkoutIndex = newPlannedWorkouts.findIndex(
      (plannedWorkout) => plannedWorkout.id === id
    );
    if (plannedWorkoutIndex !== -1) {
      const plannedWorkoutId = newPlannedWorkouts[plannedWorkoutIndex].id;
      newPlannedWorkouts.splice(plannedWorkoutIndex, 1);
      dispatch({ type: 'setPlannedWorkouts', payload: newPlannedWorkouts });
      logger(newPlannedWorkouts, 'New planned workouts');
      await removePlannedWorkout(plannedWorkoutId);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        ...state,
        muscleResolver,
        updateWorkoutName,
        planWorkout,
        removeCalendarEntry,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// Create a hook that uses the context
export function useProfile() {
  return useContext(ProfileContext);
}
