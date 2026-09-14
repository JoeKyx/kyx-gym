'use client';
import { createContext, ReactNode, useContext } from 'react';
const Availability = createContext(false);
export const useIntegrationsEnabled = () => useContext(Availability);
export function IntegrationAvailability({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <Availability.Provider value={enabled}>{children}</Availability.Provider>
  );
}
