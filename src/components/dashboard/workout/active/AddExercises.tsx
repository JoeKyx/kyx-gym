import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import Button from '@/components/buttons/Button';
import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import AddNewExerciseModal from '@/components/dashboard/workout/active/AddNewExerciseModal';

import { Exercise } from '@/types/Workout';

type AddExercisesProps = HTMLAttributes<HTMLDivElement> & {
  onExercisesAdded: () => void;
};

const AddExercises: FC<AddExercisesProps> = forwardRef<
  HTMLDivElement,
  AddExercisesProps
>((props, ref) => {
  const { className, onExercisesAdded, ...rest } = props;

  const activeWorkoutContext = useActiveWorkout();
  const availableExercises = activeWorkoutContext.availableExercises;

  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<number[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddNewExerciseModal, setShowAddNewExerciseModal] = useState(false);

  const categories = activeWorkoutContext.availableCategories;
  const muscles = activeWorkoutContext.availableMuscles;

  const filteredExercises = availableExercises.filter((exercise) => {
    const matchesSearchTerm = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === null ||
      exercise.exercise_categories?.id === selectedCategory;
    const matchesMuscles =
      selectedMuscles.length === 0 ||
      selectedMuscles.every((muscleId) =>
        exercise.muscles.some((muscle) => muscle.id === muscleId)
      );
    return (
      matchesSearchTerm &&
      matchesCategory &&
      matchesMuscles &&
      (!showOnlySelected || selectedExercises.includes(exercise))
    );
  });

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, exercise]);
  };

  const unselectExercise = (exercise: Exercise) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
  };

  const addExercisesToWorkout = async () => {
    setLoading(true);
    await activeWorkoutContext.addExercisesToWorkout(selectedExercises);
    setSelectedExercises([]);
    setLoading(false);
    onExercisesAdded();
  };

  const onAddNewExerciseModalClose = (newExerciseName: string) => {
    setSearchTerm(newExerciseName);
    setShowAddNewExerciseModal(false);
  };

  return (
    <div
      className={cn('flex h-full flex-col py-4', className)}
      ref={ref}
      {...rest}
    >
      <div className='mx-4 flex justify-between'>
        <Button onClick={() => setShowAddNewExerciseModal(true)}>
          Create New Exercise
        </Button>
        <div className='ml-2 flex gap-2'>
          <Button
            className={`transition-all duration-300 ease-in-out ${
              (selectedExercises.length === 0 && showOnlySelected) ||
              selectedExercises.length > 0
                ? 'opacity-100'
                : 'opacity-0'
            }`}
            onClick={() => setShowOnlySelected(!showOnlySelected)}
          >
            {showOnlySelected
              ? 'Show All Exercises'
              : 'Show Selected Exercises'}
          </Button>
          <Button
            isLoading={loading}
            onClick={addExercisesToWorkout}
            className={`transition-all duration-300 ease-in-out ${
              selectedExercises.length > 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Add Exercises to Workout
          </Button>
        </div>
      </div>

      <input
        type='text'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder='Search exercises...'
        className='border-primary-200 my-2 rounded-md border p-2'
      />
      <div className='flex flex-col '>
        <span className='px-2 font-semibold'>Category:</span>
        <div className='flex flex-wrap'>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                if (selectedCategory === category.id) {
                  setSelectedCategory(null);
                } else {
                  setSelectedCategory(category.id);
                }
              }}
              className={cn(
                'border-primary-500 m-1 cursor-pointer rounded-md border bg-slate-50 px-2 py-1 transition-all duration-300 ease-in-out',
                {
                  'bg-primary-600 text-white': category.id === selectedCategory,
                }
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      <div className='flex flex-col '>
        <span className='px-2 font-semibold'>Muscles:</span>
        <div className='flex flex-wrap'>
          {muscles.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => {
                if (selectedMuscles.includes(muscle.id)) {
                  setSelectedMuscles(
                    selectedMuscles.filter((m) => m !== muscle.id)
                  );
                } else {
                  setSelectedMuscles([...selectedMuscles, muscle.id]);
                }
              }}
              className={cn(
                'border-primary-500 m-1 cursor-pointer rounded-md border bg-slate-50 px-2 py-1 transition-all duration-300 ease-in-out',
                {
                  'bg-primary-600 text-white': selectedMuscles.includes(
                    muscle.id
                  ),
                }
              )}
            >
              {muscle.name}
            </button>
          ))}
        </div>
      </div>

      <div className='flex max-h-screen flex-col gap-2 overflow-auto bg-slate-200'>
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className={cn(
              'm-1 flex cursor-pointer rounded-md border bg-slate-50 p-2 transition-all duration-300 ease-in-out',
              `${
                selectedExercises.includes(exercise)
                  ? 'bg-primary-600 border-primary-800 text-white'
                  : 'border-primary-400 hover:bg-primary-500'
              }`
            )}
            onClick={() => {
              if (selectedExercises.includes(exercise)) {
                unselectExercise(exercise);
              } else {
                selectExercise(exercise);
              }
            }}
          >
            <div className='flex flex-col'>
              <span className='font-semibold'>{exercise.name}</span>
              <span className='text-sm'>{exercise.description}</span>
            </div>
          </div>
        ))}
      </div>
      <AddNewExerciseModal
        onClose={() => setShowAddNewExerciseModal(false)}
        onSuccess={onAddNewExerciseModalClose}
        open={showAddNewExerciseModal}
        availableCategories={activeWorkoutContext.availableCategories}
        availableMuscles={activeWorkoutContext.availableMuscles}
        availableExercises={activeWorkoutContext.availableExercises}
      />
    </div>
  );
});

export default AddExercises;
