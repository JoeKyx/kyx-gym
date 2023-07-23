// Auth context and auth context provider
'use client';
import { User } from 'firebase/auth';
import cookie from 'js-cookie';
import { createContext, FC, ReactNode, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase-config';

interface AuthContextProps {
  user: User | null;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const tokenName = 'token';

  useEffect(() => {
    const fetchToken = async () => {
      if (user) {
        const token = await user.getIdToken();
        cookie.set(tokenName, token, { expires: 1 });
      } else {
        cookie.remove(tokenName);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
    });

    fetchToken();

    return unsubscribe;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
