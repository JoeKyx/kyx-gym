'use client';
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

type FakeStatsRadarProps = HTMLAttributes<HTMLDivElement>;

const FakeStatsRadar: FC<FakeStatsRadarProps> = forwardRef<
  HTMLDivElement,
  FakeStatsRadarProps
>((props, ref) => {
  const { className, ...rest } = props;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const [data, _setData] = useState([
    {
      name: 'Machine',
      count: 20,
    },
    {
      name: 'Other',
      count: 10,
    },
    {
      name: 'Bodyweight',
      count: 4,
    },
    {
      name: 'Barbell',
      count: 15,
    },
    {
      name: 'Cable',
      count: 10,
    },
    {
      name: 'Dumbbell',
      count: 12,
    },
    {
      name: 'Resistance Band',
      count: 0,
    },
  ]);

  if (!hydrated) {
    return null;
  }

  return (
    <div
      className={cn(
        className,
        'flex  w-full flex-col items-center rounded-md  p-2 md:w-1/2'
      )}
      ref={ref}
      {...rest}
    >
      <ResponsiveContainer height={400} width={500}>
        <RadarChart outerRadius={150} height={400} data={data}>
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
    </div>
  );
});

export default FakeStatsRadar;
