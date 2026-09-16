import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { Scope, scopes } from '@/lib/integrations/contracts';
import { authorizationSchema, config, rpc } from '@/lib/integrations/server';
import { syncCookies } from '@/lib/supabase-cookie-adapter';

import AuthForm from '@/components/AuthForm';
import Consent from '@/components/integrations/Consent';

export const dynamic = 'force-dynamic';
export default async function Page(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const searchParams = await props.searchParams;
  try {
    const a = authorizationSchema.parse(searchParams);
    const requested = a.scope.split(' ') as Scope[];
    if (
      a.resource !== config().resource ||
      requested.some((s) => !scopes.includes(s))
    )
      throw new Error('Ungültige Anfrage.');
    const client = await rpc('gym_oauth', { op: 'client', a });
    const db = createServerComponentClient({
      cookies: syncCookies(cookieStore),
    });
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user)
      return (
        <main className='mx-auto max-w-xl space-y-4 p-6'>
          <h1 className='text-2xl font-bold'>Bei Kyx Gym anmelden</h1>
          <p>Danach kannst du die Rechte für {client.name} auswählen.</p>
          <AuthForm />
        </main>
      );
    return (
      <main className='p-4'>
        <Consent
          name={client.name}
          requested={requested}
          query={new URLSearchParams(searchParams).toString()}
        />
      </main>
    );
  } catch {
    return (
      <main className='p-6'>
        Die Verbindungsanfrage ist ungültig oder die Einrichtung ist noch nicht
        verfügbar. Bitte starte die Verbindung erneut in deinem Agenten.
      </main>
    );
  }
}
