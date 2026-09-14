'use client';
import { useIntegrationsEnabled } from '@/components/integrations/IntegrationAvailability';
import DashboardLink from '@/components/links/DashboardLink';

export default function PlannedWorkoutsButton() {
  const enabled = useIntegrationsEnabled();
  if (!enabled) return null;
  return (
    <DashboardLink
      text='Geplante Workouts'
      image='/images/dashboard/historyMobile.jpeg'
      href='/dashboard/plans'
    />
  );
}
