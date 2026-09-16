import Link from 'next/link';

import CardioSessions from '@/components/integrations/CardioSessions';

export default function Page() {
  return (
    <main className='mx-auto w-full max-w-3xl space-y-4 p-4 pb-24'>
      <Link className='underline' href='/dashboard'>
        ← Dashboard
      </Link>
      <CardioSessions />
    </main>
  );
}
