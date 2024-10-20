import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import CategoryRadar from '@/components/stats/CategoryRadar';
import MainStatsChart from '@/components/stats/MainStatsChart';
import MainStatsHeader from '@/components/stats/MainStatsHeader';
import MusclePie from '@/components/stats/MusclePie';

type MainStatsProps = HTMLAttributes<HTMLDivElement>;

const MainStats: FC<MainStatsProps> = forwardRef<
  HTMLDivElement,
  MainStatsProps
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(className, 'mb-10 flex flex-col gap-4')}
      ref={ref}
      {...rest}
    >
      <MainStatsHeader className='rounded-md' />

      <MainStatsChart />
      <div className='flex flex-col gap-4 md:flex-row'>
        <CategoryRadar />
        <MusclePie />
      </div>
    </div>
  );
});

export default MainStats;
