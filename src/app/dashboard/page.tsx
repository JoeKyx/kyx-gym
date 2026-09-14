import { Metadata } from 'next';
import { FC } from 'react';

import Dashboard from '@/components/dashboard/Dashboard';
import DashboardMobile from '@/components/dashboard/DashboardMobile';
import MainNav from '@/components/navbar/MainNav';

export const metadata: Metadata = {
  title: 'Kyx Gym - Dashboard',
  description:
    'The dashboard for Kyx Gym. Letting users start workouts and track their progress.',
};

const page: FC = () => {
  return (
    <div>
      <div className='hidden md:block'>
        <MainNav className='mb-4 hidden w-full rounded-md bg-white p-3 opacity-75 shadow-lg md:block' />
        <Dashboard className='flex h-[80vh] flex-col gap-4 md:mx-4 md:flex-row ' />
      </div>
      <div>
        <DashboardMobile className='block md:hidden' />
      </div>
    </div>
  );
};

export default page;
