'use client';
import { Plug } from 'lucide-react';

import { useIntegrationsEnabled } from '@/components/integrations/IntegrationAvailability';
import ButtonLink from '@/components/links/ButtonLink';

export default function ConnectionsLink() {
  const enabled = useIntegrationsEnabled();
  if (!enabled) return null;
  return (
    <ButtonLink
      href='/dashboard/connections'
      variant='outline'
      leftIcon={Plug}
      className='shrink-0 justify-center gap-1'
    >
      Agenten &amp; Verbindungen
    </ButtonLink>
  );
}
