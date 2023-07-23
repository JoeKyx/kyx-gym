import { auth } from 'firebase-admin';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { customInitApp } from '@/lib/firebase-admin-config';
import logger from '@/lib/logger';

// Init the Firebase SDK every time the server is called
customInitApp();

export async function POST(_req: NextRequest, _response: NextResponse) {
  const authorization = headers().get('Authorization');
  logger(authorization, 'POST /api/login: authorization');
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
      logger(options, 'route.tsx line 37');

      cookies().set(options);
    }
  }

  return NextResponse.json({}, { status: 200 });
}

export async function GET(_req: NextRequest) {
  const session = cookies().get('session');
  logger(session, 'route.tsx line 40');

  if (!session) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  // Use Firebase Admin to validate the session cookie
  logger(session.value, 'route.tsx line 46');
  const decodedClaims = await auth().verifySessionCookie(session.value, true);

  if (!decodedClaims) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  return NextResponse.json({ isLoggedIn: true }, { status: 200 });
}
