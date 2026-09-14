import Link from 'next/link';

import Connections from '@/components/integrations/Connections';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (
    <main className='mx-auto w-full max-w-3xl space-y-5 p-4 pb-24'>
      <Link href='/dashboard'>← Dashboard</Link>
      <h1 className='text-2xl font-bold'>Agenten &amp; Verbindungen</h1>
      <Connections url={process.env.MCP_PUBLIC_URL || null} />
    </main>
  );
}
