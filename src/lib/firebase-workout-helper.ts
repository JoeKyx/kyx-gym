import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
} from 'firebase/firestore';

import { firestore } from '@/lib/firebase-config';
import logger from '@/lib/logger';

import {
  Category,
  Exercise,
  FilledExercise,
  Muscle,
  WorkoutItem,
  WorkoutItemWithExercise,
} from '@/types/Workout';

interface FirestoreCache {
  [key: string]: DocumentData;
}

const firestoreCache: FirestoreCache = {};

export const loadExerciseForWorkoutItem = async (workoutItem: WorkoutItem) => {
  const exerciseRef = workoutItem.exercise;

  let exerciseDoc: DocumentData;
  if (firestoreCache[exerciseRef.path]) {
    exerciseDoc = firestoreCache[exerciseRef.path];
  } else {
    exerciseDoc = await getDoc(exerciseRef);
    firestoreCache[exerciseRef.path] = exerciseDoc;
  }

  const exercise = exerciseDoc.data() as Exercise;

  const filledExercise = await fillExercise(exercise);

  return { ...workoutItem, filledExercise } as WorkoutItemWithExercise;
};
export const fillExercise = async (
  exercise: Exercise
): Promise<FilledExercise> => {
  const muscles: Muscle[] = await Promise.all(
    exercise.muscles.map(async (muscleRef) => {
      let muscleDoc: DocumentData;
      if (firestoreCache[muscleRef.path]) {
        muscleDoc = firestoreCache[muscleRef.path];
      } else {
        muscleDoc = await getDoc(muscleRef);
        firestoreCache[muscleRef.path] = muscleDoc;
      }
      return { ...muscleDoc.data(), ref: muscleRef } as Muscle;
    })
  );

  let categoryDoc: DocumentData;
  if (!exercise.category) {
    exercise.category = doc(firestore, 'categories', 'Ku6zIxR7fZXgTdPaZbn8');
  }
  if (firestoreCache[exercise.category?.path]) {
    categoryDoc = firestoreCache[exercise.category.path];
  } else {
    categoryDoc = await getDoc(exercise.category);
    firestoreCache[exercise.category.path] = categoryDoc;
  }

  const category: Category = {
    ...categoryDoc.data(),
    ref: exercise.category,
  } as Category;

  return { ...exercise, muscles, category } as FilledExercise;
};

export const getAllMuscles = async (): Promise<Muscle[]> => {
  const muscleDocs = await getDocs(collection(firestore, 'muscles'));

  const muscles: Muscle[] = muscleDocs.docs.map((doc) => {
    const muscle = doc.data() as Muscle;
    const muscleWithRef = { ...muscle, id: doc.id, ref: doc.ref } as Muscle;
    firestoreCache[doc.ref.path] = doc;
    return muscleWithRef;
  });

  return muscles;
};

export const getAllCategories = async (): Promise<Category[]> => {
  const categoryDocs = await getDocs(collection(firestore, 'categories'));

  const categories: Category[] = categoryDocs.docs.map((doc) => {
    const category = doc.data() as Category;
    const categoryWithRef = {
      ...category,
      id: doc.id,
      ref: doc.ref,
    } as Category;
    firestoreCache[doc.ref.path] = doc;
    return categoryWithRef;
  });

  return categories;
};

export const getAllExercises = async (): Promise<FilledExercise[]> => {
  const exerciseDocs = await getDocs(collection(firestore, 'Exercises'));
  logger(exerciseDocs, 'exerciseDocs');
  const exercises: FilledExercise[] = [];
  for (const doc of exerciseDocs.docs) {
    const exercise = { ...doc.data(), ref: doc.ref } as Exercise;
    logger(exercise, 'exercise');
    firestoreCache[doc.ref.path] = doc;
    const filledExercise = await fillExercise(exercise);
    exercises.push(filledExercise);
  }

  return exercises;
};
