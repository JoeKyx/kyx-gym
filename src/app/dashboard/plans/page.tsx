import Link from 'next/link';

import PlannedWorkouts from '@/components/integrations/PlannedWorkouts';
export default function Page() {
  return (
    <main className='mx-auto w-full max-w-3xl space-y-4 p-4 pb-24'>
      <Link href='/dashboard'>← Dashboard</Link>
      <PlannedWorkouts />
    </main>
  );
}
