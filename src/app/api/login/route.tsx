import { auth } from 'firebase-admin';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { customInitApp } from '@/lib/firebase-admin-config';

// Init the Firebase SDK every time the server is called
customInitApp();

export async function POST(_req: NextRequest, _response: NextResponse) {
  const authorization = headers().get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await auth().verifyIdToken(idToken);

    if (decodedToken) {
      // Generate session cookie
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await auth().createSessionCookie(idToken, {
        expiresIn,
      });
      const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      };

      cookies().set(options);
    }
  }

  return NextResponse.json({}, { status: 200 });
}

export async function GET(_req: NextRequest) {
  const session = cookies().get('session');

  if (!session) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  // Use Firebase Admin to validate the session cookie
  const decodedClaims = await auth().verifyIdToken(session.value, true);

  if (!decodedClaims) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  return NextResponse.json({ isLoggedIn: true }, { status: 200 });
}
