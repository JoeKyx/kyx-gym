import { zodResolver } from '@hookform/resolvers/zod';
import {} from '@radix-ui/react-dropdown-menu';
import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Drawer } from 'vaul';
import { z } from 'zod';

import logger from '@/lib/logger';
import { addExercise } from '@/lib/supabase-util';

import Button from '@/components/buttons/Button';
import { useActiveWorkout } from '@/components/context/ActiveWorkoutContext';
import { useSocial } from '@/components/context/SocialContext';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import {
  DBCategory,
  DBExercise,
  DBInsertExercise,
  DBMuscle,
} from '@/types/Workout';

const formSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
  muscles: z.array(z.number().nonnegative()).nonempty(),
  category: z.number().nonnegative(),
});

type AddNewExerciseModalProps = {
  open: boolean;
  availableMuscles: DBMuscle[];
  availableCategories: DBCategory[];
  availableExercises: DBExercise[];
  onSuccess?: (newExerciseName: string) => void;
  onClose: () => void;
};

const AddNewExerciseModal: FC<AddNewExerciseModalProps> = ({
  open,
  availableMuscles,
  availableCategories,
  availableExercises,
  onSuccess,
  onClose,
}) => {
  const [selectedMuscles, setSelectedMuscles] = useState<number[]>([0]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const socialContext = useSocial();

  const activeWorkoutContext = useActiveWorkout();

  const handleMuscleChange = (muscleId: number) => {
    if (muscleId === 0) {
      setSelectedMuscles([0]);
      return;
    }
    if (selectedMuscles.includes(muscleId)) {
      logger(selectedMuscles, 'selectedMuscles');
      if (selectedMuscles.length === 1) setSelectedMuscles([0]);
      else {
        setSelectedMuscles((prev) => prev.filter((id) => id !== muscleId));
      }
    } else {
      if (selectedMuscles.includes(0)) setSelectedMuscles([muscleId]);
      else {
        setSelectedMuscles((prev) => [...prev, muscleId]);
      }
    }
  };

  const reset = () => {
    form.reset();
    setSelectedMuscles([0]);
    setErrorText(null);
    setHasError(false);
    setLoading(false);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    logger(selectedMuscles, 'selectedMuscles');
    if (selectedMuscles.length) {
      form.setValue('muscles', selectedMuscles as [number, ...number[]]);
    } else {
      form.setValue('muscles', [0]);
    }
  }, [form, selectedMuscles]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Check if there is already an exercise with this name
    const exerciseExists = availableExercises.some(
      (exercise) => exercise.name === values.name
    );

    if (exerciseExists) {
      setErrorText('An exercise with this name already exists.');
      setHasError(true);
      setLoading(false);
      return;
    }
    const exercise: DBInsertExercise = {
      name: values.name,
      type: 'weight',
      description: values.description,
      categoryid: values.category,
      userid: socialContext?.userProfile?.userid,
      public: false,
    };
    // If we have an activeWorkoutContext also add it there
    if (activeWorkoutContext.activeWorkout) {
      const res = await activeWorkoutContext.createNewExercise(
        exercise,
        selectedMuscles
      );
      if (res.success) {
        if (onSuccess) {
          onSuccess(exercise.name);
        }
        reset();
        setLoading(false);
        return;
      } else {
        setErrorText(res.message);
        setHasError(true);
        setLoading(false);
        return;
      }
    } else {
      const res = await addExercise(exercise, selectedMuscles);
      if (res.success) {
        if (onSuccess) {
          onSuccess(exercise.name);
        }
        reset();
        setLoading(false);
        return;
      } else {
        setErrorText(res.error || 'An error occured.');
        setHasError(true);
        setLoading(false);
        return;
      }
    }
  }

  return (
    <Drawer.Root dismissible={true} open={open} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-[10px] bg-zinc-100'>
          <div className='flex-1 rounded-t-[10px] bg-white p-4'>
            <div className='mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300' />
            <div className='mx-auto max-w-md'>
              <Drawer.Title className='mb-4 font-medium'>
                Create a new exercise
              </Drawer.Title>
              <Form {...form}>
                <FormField
                  name='name'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className='my-2'>
                      <FormLabel>Exercise Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Your exercise name' {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the name of your exercise.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='description'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className='my-2'>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder='Your exercise name' {...field} />
                      </FormControl>
                      <FormDescription>
                        A short description of your exercise. This is optional.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='category'
                  control={form.control}
                  render={() => (
                    <FormItem className='my-2'>
                      <FormLabel>Category</FormLabel>

                      <Select
                        onValueChange={(value) => {
                          form.setValue('category', parseInt(value));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position='popper'
                          className='SelectContent rounded-md rounded-b-none bg-slate-200'
                        >
                          {availableCategories.map((category) => (
                            <SelectItem
                              value={category.id.toString()}
                              key={category.id}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormDescription>
                        The category of your exercise.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='muscles'
                  control={form.control}
                  render={() => (
                    <FormItem className='my-2'>
                      <DropdownMenu>
                        <FormControl>
                          <DropdownMenuTrigger asChild>
                            <Button variant='outline'>Muscles</Button>
                          </DropdownMenuTrigger>
                        </FormControl>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Muscles</DropdownMenuLabel>
                          <DropdownMenuGroup>
                            {availableMuscles.map((muscle) => (
                              <DropdownMenuCheckboxItem
                                checked={selectedMuscles.includes(muscle.id)}
                                onCheckedChange={() =>
                                  handleMuscleChange(muscle.id)
                                }
                                key={muscle.id}
                              >
                                {muscle.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormDescription>
                        The muscles that are used in this exercise.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  {hasError && <p className='text-red-500'>{errorText}</p>}
                </div>
                <Button
                  isLoading={loading}
                  type='button'
                  variant='primary'
                  onClick={form.handleSubmit(onSubmit)}
                  className='mb-6 w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
                >
                  Create Exercise
                </Button>
              </Form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AddNewExerciseModal;
