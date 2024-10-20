import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import Button from '@/components/buttons/Button';
import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import AddNewExerciseModal from '@/components/dashboard/workout/active/AddNewExerciseModal';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

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
      <div className='mx-1 flex max-h-12 justify-between'>
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
        <Select
          onValueChange={(e) =>
            e == 'All' ? setSelectedCategory(null) : setSelectedCategory(+e)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Select a category to filter' />
          </SelectTrigger>
          <SelectContent className='SelectContent rounded-md rounded-b-none bg-slate-200'>
            <SelectItem value='All' key='All'>
              All
            </SelectItem>
            {categories.map((category) => (
              <SelectItem value={category.id.toString()} key={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col '>
        <span className='px-2 font-semibold'>Muscles:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='light'>
              {selectedMuscles.length
                ? selectedMuscles
                    .map(
                      (muscleId) =>
                        muscles.find((muscle) => muscle.id === muscleId)?.name
                    )
                    .join(', ')
                : 'Select Muscles to filter'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Muscles</DropdownMenuLabel>
            <DropdownMenuGroup>
              {muscles.map((muscle) => (
                <DropdownMenuCheckboxItem
                  checked={selectedMuscles.includes(muscle.id)}
                  onCheckedChange={() =>
                    setSelectedMuscles((prev) =>
                      prev.includes(muscle.id)
                        ? prev.filter((id) => id !== muscle.id)
                        : [...prev, muscle.id]
                    )
                  }
                  key={muscle.id}
                >
                  {muscle.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex max-h-screen flex-col gap-2 overflow-auto bg-slate-200'>
        {filteredExercises
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort(
            (a, b) =>
              (b.amount_of_times_performed || 0) -
              (a.amount_of_times_performed || 0)
          )
          .map((exercise) => (
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
              <div className='flex w-full flex-col'>
                <div className='flex w-full justify-between'>
                  <span className='font-semibold'>{exercise.name}</span>
                  <span className='text-sm'>
                    {exercise.amount_of_times_performed || 0} x
                  </span>
                </div>
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
