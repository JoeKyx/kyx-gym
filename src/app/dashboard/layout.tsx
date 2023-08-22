import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SocialProvider } from '@/components/context/SocialContext';
import FirstLoginModal from '@/components/dashboard/FirstLoginModal';

import { Database } from '@/types/supabase';
export const dynamic = 'force-dynamic';
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // this is a protected route - only users who are signed in can view this route
    redirect('/');
  }

  return (
    <SocialProvider>
      <div className='flex flex-col md:h-screen md:max-h-screen'>
        {children}
        <FirstLoginModal />
      </div>
    </SocialProvider>
  );
}
