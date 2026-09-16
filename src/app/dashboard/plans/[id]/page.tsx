import Link from 'next/link';

import PlanDetail from '@/components/integrations/PlanDetail';
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <main className='mx-auto w-full max-w-3xl space-y-4 p-4 pb-24'>
      <Link href='/dashboard/plans'>← Geplante Workouts</Link>
      <PlanDetail id={params.id} />
    </main>
  );
}
