import { DBMuscle, DBSet, Workout } from '@/types/Workout';

export const totalWeightLifted = (sets: DBSet[]): number => {
  return sets.reduce((total, set) => {
    if (set.is_finished) {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      return total + weight * reps;
    }
    return total;
  }, 0);
};

export const percentageDone = (workout: Workout): number => {
  const totalSets = workout.workout_items.reduce((total, item) => {
    return total + item.sets.length;
  }, 0);
  const finishedSets = workout.workout_items.reduce((total, item) => {
    return total + item.sets.filter((set) => set.is_finished).length;
  }, 0);
  return Math.round((finishedSets / totalSets) * 100);
};

export const getAllMuscles = (workout: Workout): DBMuscle[] => {
  const muscles: DBMuscle[] = [];
  workout.workout_items.forEach((item) => {
    const itemMuscles = item.exercises?.muscles;
    if (itemMuscles) {
      itemMuscles.forEach((muscle) => {
        if (!muscles.find((m) => m.id === muscle.id)) {
          muscles.push(muscle);
        }
      });
    }
  });
  return muscles;
};

export const mostUsedMuscleInWorkout = (workout: Workout): DBMuscle | null => {
  const muscleCounts: { [key: number]: number } = {};

  workout.workout_items.forEach((item) => {
    const muscles = item.exercises?.muscles;
    if (muscles) {
      muscles.forEach((muscle) => {
        if (muscleCounts[muscle.id]) {
          muscleCounts[muscle.id] += 1;
        } else {
          muscleCounts[muscle.id] = 1;
        }
      });
    }
  });

  let mostUsedMuscleId: number | null = null;
  let maxCount = 0;

  for (const [muscleId, count] of Object.entries(muscleCounts)) {
    if (count > maxCount) {
      mostUsedMuscleId = Number(muscleId);
      maxCount = count;
    }
  }

  // Assuming you have a way to retrieve all muscles, either from `workout` or from another source
  const allMuscles = getAllMuscles(workout);
  return allMuscles.find((m) => m.id === mostUsedMuscleId) || null;
};
