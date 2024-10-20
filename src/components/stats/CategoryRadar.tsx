'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cn } from '@/lib';

import { useProfile } from '@/components/context/ProfileContext';

import { Database } from '@/types/supabase';
import { CategoryCountSummary } from '@/types/Workout';

type CategoryRadarProps = HTMLAttributes<HTMLDivElement>;

const CategoryRadar: FC<CategoryRadarProps> = forwardRef<
  HTMLDivElement,
  CategoryRadarProps
>((props, ref) => {
  const { className, ...rest } = props;

  const profileContext = useProfile();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CategoryCountSummary[]>([]);

  useEffect(() => {
    const loadCategoryCountSummary = async () => {
      if (profileContext.userProfile?.userid) {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('category_count')
          .select('*')
          .eq('user_id', profileContext.userProfile.userid);
        if (error) {
          setError(error.message);
        } else {
          setData(data);
        }
        setLoading(false);
      }
    };
    loadCategoryCountSummary();
  }, [profileContext.userProfile?.userid]);

  return (
    <div
      className={cn(
        className,
        'flex h-full w-full flex-col items-center rounded-md bg-white p-2 shadow-md md:w-1/2'
      )}
      ref={ref}
      {...rest}
    >
      <h2 className='w-1/3 text-center text-lg font-semibold'>
        Category Radar
      </h2>
      {error && <p className='text-red-500'>{error}</p>}
      {!loading ? (
        <ResponsiveContainer width='100%' height={400}>
          <RadarChart outerRadius={150} width={500} height={500} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey='name' />
            <PolarRadiusAxis />
            <Tooltip
              formatter={(value: number) => [
                `performed ${value} exercises`,
                null,
              ]}
            />
            <Radar
              name='name'
              dataKey='count'
              stroke='#0d9488'
              fill='#14b8a6'
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
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

export default CategoryRadar;
