import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST() {
  const options = {
    name: 'session',
    value: '',
    maxAge: -1,
  };

  (await cookies()).set(options);
  return NextResponse.json({}, { status: 200 });
}
