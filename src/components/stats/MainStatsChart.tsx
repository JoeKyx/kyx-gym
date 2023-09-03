'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { FC, forwardRef, useCallback, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import { useProfile } from '@/components/context/ProfileContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import { ExerciseHistory } from '@/types/Stats';
import { Database } from '@/types/supabase';

type MainStatsChartProps = HTMLAttributes<HTMLDivElement>;

const MainStatsChart: FC<MainStatsChartProps> = forwardRef<
  HTMLDivElement,
  MainStatsChartProps
>((props, ref) => {
  const { className, ...rest } = props;

  const profileContext = useProfile();

  type ExerciseHistoryData = {
    loading: boolean;
    exerciseHistory: ExerciseHistory[] | null;
  };

  type StatsExercise = {
    id: number;
    name: string;
  };

  const [exerciseHistoryData, setExerciseHistoryData] =
    useState<ExerciseHistoryData>({
      loading: true,
      exerciseHistory: null,
    });

  type YAxisInfo = {
    valueRef: 'value1' | 'value2';
    name: string;
    value: number;
    postfix: string;
  };

  type StatsExerciseChartData = {
    Name: string;
    Date: string;
    value1?: number;
    value2?: number;
  };

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exercises, setExercises] = useState<StatsExercise[]>([]);
  const [yAxisInfo1, setYAxisInfo1] = useState<YAxisInfo>({
    valueRef: 'value1',
    name: '',
    value: 0,
    postfix: '',
  });

  const [yAxisInfo2, setYAxisInfo2] = useState<YAxisInfo | null>(null);

  const [selectedExercise, setSelectedExercise] =
    useState<StatsExercise | null>(null);

  const [exerciseChartData, setExerciseChartData] = useState<
    StatsExerciseChartData[]
  >([]);

  const mapExerciseHistoryToChartData = useCallback(
    (exerciseHistory: ExerciseHistory): StatsExerciseChartData => {
      switch (exerciseHistory.type_of_exercise) {
        case 'weight':
          return {
            Name: exerciseHistory.exercise_name
              ? exerciseHistory.exercise_name
              : '',
            Date: exerciseHistory.workout_finished_at
              ? format(
                  new Date(exerciseHistory.workout_finished_at),
                  'MM/dd/yyyy'
                )
              : '',
            value1: exerciseHistory.max_weight ? exerciseHistory.max_weight : 0,
            value2: exerciseHistory.volume ? exerciseHistory.volume : 0,
          };
        case 'speed':
          return {
            Name: exerciseHistory.exercise_name
              ? exerciseHistory.exercise_name
              : '',
            Date: exerciseHistory.workout_finished_at
              ? format(
                  new Date(exerciseHistory.workout_finished_at),
                  'MM/dd/yyyy'
                )
              : '',
            value1: exerciseHistory.speed ? exerciseHistory.speed : 0,
            value2: exerciseHistory.distance ? exerciseHistory.distance : 0,
          };
        case 'other':
          return {
            Name: exerciseHistory.exercise_name
              ? exerciseHistory.exercise_name
              : '',
            Date: exerciseHistory.workout_finished_at
              ? format(
                  new Date(exerciseHistory.workout_finished_at),
                  'MM/dd/yyyy'
                )
              : '',
            value1: exerciseHistory.reps ? exerciseHistory.reps : 0,
          };
        case 'time':
          return {
            Name: exerciseHistory.exercise_name
              ? exerciseHistory.exercise_name
              : '',
            Date: exerciseHistory.workout_finished_at
              ? format(
                  new Date(exerciseHistory.workout_finished_at),
                  'MM/dd/yyyy'
                )
              : '',
            value1: exerciseHistory.speed ? exerciseHistory.speed : 0,
          };
        default:
          return {
            Name: exerciseHistory.exercise_name
              ? exerciseHistory.exercise_name
              : '',
            Date: exerciseHistory.workout_finished_at
              ? format(
                  new Date(exerciseHistory.workout_finished_at),
                  'MM/dd/yyyy'
                )
              : '',
            value1: exerciseHistory.max_weight ? exerciseHistory.max_weight : 0,
            value2: exerciseHistory.volume ? exerciseHistory.volume : 0,
          };
      }
    },
    []
  );

  const updateYAxisInfo = useCallback(
    (typeOfExercise: 'weight' | 'speed' | 'other' | 'time') => {
      switch (typeOfExercise) {
        case 'weight':
          setYAxisInfo1({
            valueRef: 'value1',
            name: 'Max Weight',
            value: 0,
            postfix: 'kg',
          });
          setYAxisInfo2({
            valueRef: 'value2',
            name: 'Volume',
            value: 0,
            postfix: 'kg',
          });
          break;
        case 'speed':
          setYAxisInfo1({
            valueRef: 'value1',
            name: 'Duration',
            value: 0,
            postfix: 'min',
          });
          setYAxisInfo2({
            valueRef: 'value2',
            name: 'Distance',
            value: 0,
            postfix: 'km',
          });
          break;
        case 'other':
          setYAxisInfo1({
            valueRef: 'value1',
            name: 'Reps',
            value: 0,
            postfix: '',
          });
          setYAxisInfo2(null);
          break;
        default:
          setYAxisInfo1({
            valueRef: 'value1',
            name: 'Max Weight',
            value: 0,
            postfix: 'kg',
          });
          setYAxisInfo2({
            valueRef: 'value2',
            name: 'Volume',
            value: 0,
            postfix: 'kg',
          });
          break;
      }
    },
    []
  );

  useEffect(() => {
    if (exerciseHistoryData.exerciseHistory && selectedExercise) {
      const exerciseForChart = exerciseHistoryData.exerciseHistory.filter(
        (exercise) => exercise.exercise_id === selectedExercise.id
      );
      // sort by date

      const exerciseChartData = exerciseForChart
        .sort((a, b) => {
          if (!a.workout_finished_at || !b.workout_finished_at) return 0;
          return (
            new Date(a.workout_finished_at).getTime() -
            new Date(b.workout_finished_at).getTime()
          );
        })
        .map((exercise) => ({
          ...mapExerciseHistoryToChartData(exercise),
        }));
      setExerciseChartData(exerciseChartData);
      if (exerciseForChart[0].type_of_exercise) {
        updateYAxisInfo(exerciseForChart[0].type_of_exercise);
      }
    }
  }, [
    exerciseHistoryData.exerciseHistory,
    mapExerciseHistoryToChartData,
    selectedExercise,
    updateYAxisInfo,
  ]);

  useEffect(() => {
    if (
      profileContext.userProfile?.userid &&
      profileContext.workouts.length > 0
    ) {
      const loadExerciseHistory = async () => {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('exercise_history')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid);
        if (error) {
          setError(error.message);
        } else {
          logger(data, 'data from exercise history');
          setExerciseHistoryData({
            loading: false,
            exerciseHistory: data,
          });
          // get all exercises from data (put in set to remove duplicates)
          const exercises = data
            .filter(
              (exercise) =>
                typeof exercise.exercise_id === 'number' &&
                typeof exercise.exercise_name === 'string'
            )
            .map((exercise) => ({
              id: exercise.exercise_id,
              name: exercise.exercise_name,
            }));

          const uniqueExercises = [
            ...new Set(exercises.map((exercise) => exercise.id)),
          ].map((id) => {
            return exercises.find((exercise) => exercise.id === id);
          });
          setExercises(uniqueExercises as StatsExercise[]);
          setSelectedExercise(uniqueExercises[0] as StatsExercise);
        }
        setLoading(false);
      };

      loadExerciseHistory();
    }
  }, [profileContext.userProfile?.userid, profileContext.workouts.length]);

  return (
    <div
      className={cn(className, 'h-full w-full rounded-md bg-white shadow-md')}
      ref={ref}
      {...rest}
    >
      <div className='flex flex-row items-center justify-between p-2'>
        <h2 className='w-1/3 text-lg font-semibold'>
          Exercise History - {selectedExercise?.name}
        </h2>
        {error && <p className='text-red-500'>{error}</p>}
        <Select
          onValueChange={(value) => {
            const selectedExercise = exercises.find(
              (exercise) => exercise.id === Number(value)
            );
            setSelectedExercise(selectedExercise as StatsExercise);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select an Exercise' />
          </SelectTrigger>
          <SelectContent className='SelectContent rounded-md rounded-b-none bg-slate-200'>
            {exercises.map((exercise) => (
              <SelectItem value={exercise.id.toString()} key={exercise.id}>
                {exercise.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!loading ? (
        <div className='flex items-start justify-center md:h-full'>
          <ResponsiveContainer width='100%' height={400}>
            <ComposedChart
              width={500}
              height={300}
              data={exerciseChartData}
              margin={{
                top: 5,
                right: 20,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='Date' />
              <YAxis
                yAxisId='1'
                label={{
                  value: yAxisInfo1.name,
                  angle: -90,
                  position: 'insideLeft',
                }}
                tickFormatter={(value) => `${value} ${yAxisInfo1.postfix}`}
              />
              {yAxisInfo2 && (
                <YAxis
                  yAxisId='2'
                  orientation='right'
                  label={{
                    value: yAxisInfo2.name,
                    angle: 90,
                    position: 'outsideRight',
                  }}
                  tickFormatter={(value) => `${value} ${yAxisInfo2.postfix}`}
                />
              )}
              <Tooltip
                formatter={(value, name) => {
                  if (name === yAxisInfo1.valueRef) {
                    return [`${value} ${yAxisInfo1.postfix}`, yAxisInfo1.name];
                  }
                  if (name === yAxisInfo2?.valueRef) {
                    return [`${value} ${yAxisInfo2.postfix}`, yAxisInfo2.name];
                  }
                  return [value, name];
                }}
              />
              <Legend
                formatter={(value, _entry, _index) => {
                  if (value === yAxisInfo1.valueRef) {
                    return `${yAxisInfo1.name} (${yAxisInfo1.postfix})`;
                  }
                  if (yAxisInfo2 && value === yAxisInfo2?.valueRef) {
                    return `${yAxisInfo2.name} (${yAxisInfo2.postfix})`;
                  }
                  return value;
                }}
              />
              <Line
                type='monotone'
                dataKey='value1'
                stroke='#8884d8'
                activeDot={{ r: 8 }}
                yAxisId='1'
              />
              {yAxisInfo2 && (
                <Area
                  type='monotone'
                  dataKey='value2'
                  fill='#14b8a6'
                  stroke='#0d9488'
                  yAxisId='2'
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className='flex h-full flex-col items-center justify-center'>
          <div className='h-full'>
            <Loader2 className='text-primary-500 animate-spin' size={24} />
          </div>
        </div>
      )}
    </div>
  );
});

export default MainStatsChart;
