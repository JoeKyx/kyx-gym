'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { cn } from '@/lib';

import { useProfile } from '@/components/context/ProfileContext';

import { Database } from '@/types/supabase';
import { MuscleCountSummary } from '@/types/Workout';

type MusclePieProps = HTMLAttributes<HTMLDivElement>;

const MusclePie: FC<MusclePieProps> = forwardRef<
  HTMLDivElement,
  MusclePieProps
>((props, ref) => {
  const { className, ...rest } = props;

  const profileContext = useProfile();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type MusclePieData = {
    name: string;
    value: number;
    area_name: string;
  };
  type MuscleAreaPieData = {
    name: string;
    area_value: number;
  };
  const [muscleData, setMuscleData] = useState<MusclePieData[]>([]);
  const [muscleAreaData, setMuscleAreaData] = useState<MuscleAreaPieData[]>([]);

  useEffect(() => {
    const loadMuscleCountSummary = async () => {
      if (profileContext.userProfile?.userid) {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('muscles_count')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid);
        if (error) {
          setError(error.message);
        } else {
          const muscleData: MusclePieData[] = [];
          const muscleAreaData: MuscleAreaPieData[] = [];
          data.forEach((muscleCountSummary: MuscleCountSummary) => {
            muscleData.push({
              name: muscleCountSummary.muscle_name || 'Unknown',
              value: muscleCountSummary.count || 0,
              area_name: muscleCountSummary.muscle_area_name || 'Unknown',
            });
            // Multiple muscles can have the same muscle area, so we need to check if the muscle area is already in the array, if it is, we add the count to the existing value
            const muscleAreaIndex = muscleAreaData.findIndex(
              (muscleArea: MuscleAreaPieData) =>
                muscleArea.name === muscleCountSummary.muscle_area_name
            );
            if (muscleAreaIndex === -1) {
              muscleAreaData.push({
                name: muscleCountSummary.muscle_area_name || 'Unknown',
                area_value: muscleCountSummary.count || 0,
              });
            } else {
              muscleAreaData[muscleAreaIndex].area_value +=
                muscleCountSummary.count || 0;
            }
          });
          // Sort muscle data by muscle area name
          setMuscleData(
            muscleData.sort((a, b) => a.area_name.localeCompare(b.area_name))
          );
          setMuscleAreaData(
            muscleAreaData.sort((a, b) => a.name.localeCompare(b.name))
          );
        }
        setLoading(false);
      }
    };
    loadMuscleCountSummary();
  }, [profileContext.userProfile?.userid]);

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill='black'
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline='central'
      >
        {`${(percent * 100).toFixed(0)}% ${name}`}
      </text>
    );
  };

  return (
    <div
      className={cn(
        className,
        'flex h-full w-full flex-col items-center rounded-md bg-white p-2 shadow-md md:w-1/2'
      )}
      ref={ref}
      {...rest}
    >
      <h2 className='w-1/3 text-center text-lg font-semibold'>Muscle Pie</h2>
      {error && <p className='text-red-500'>{error}</p>}
      {!loading && muscleData.length === 0 && (
        <p className='bg-primary-500'>
          No data to display. It seems like you haven't worked out yet?
        </p>
      )}
      {!loading && muscleData.length > 0 ? (
        <ResponsiveContainer width='100%' height={400}>
          <PieChart width={400} height={400}>
            <Pie
              data={muscleData}
              dataKey='value'
              cx='50%'
              cy='50%'
              outerRadius={150}
              fill='#0f766e'
              labelLine={false}
              id='innerPie'
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                // in Percentage and in times worked out
                return [
                  `${(
                    (value / muscleData.reduce((a, b) => a + b.value, 0)) *
                    100
                  ).toFixed(2)}% - ${value} times`,
                  `${name}`,
                ];
              }}
            />
            <Pie
              data={muscleAreaData}
              dataKey='area_value'
              cx='50%'
              cy='50%'
              innerRadius={160}
              outerRadius={190}
              labelLine={false}
              fill='#14b8a6'
              label={renderCustomizedLabel}
              id='outterPie'
            />
          </PieChart>
        </ResponsiveContainer>
      ) : loading ? (
        <div className='flex h-full flex-col items-center justify-center'>
          <div className='h-full'>
            <Loader2 className='text-primary-500 animate-spin' />
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default MusclePie;
