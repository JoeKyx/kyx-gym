'use client';
import { Loader2Icon } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { loadTemplatesFromDB } from '@/lib/supabase-util';

import { useSocial } from '@/components/context/SocialContext';
import TemplateContainer from '@/components/dashboard/templates/TemplateContainer';
import PathNav from '@/components/navbar/PathNav';

import { Template } from '@/types/Workout';

const Templates: FC = () => {
  const socialContext = useSocial();
  const userId = socialContext?.userProfile?.userid;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setErrorMessage(null);
    // Get the templates
    const getTemplates = async () => {
      const templatesRes = await loadTemplatesFromDB();
      if (templatesRes.error || !templatesRes.data) {
        setErrorMessage(templatesRes.error);
      } else {
        setTemplates(templatesRes.data || []);
      }
      setLoading(false);
    };
    getTemplates();
  }, [userId]);

  return (
    <div className='mx-10 mt-4 flex flex-col gap-4'>
      <PathNav
        paths={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Templates' },
        ]}
      />

      {loading && (
        <Loader2Icon
          className='text-primary-500 h-full animate-spin'
          size={64}
        />
      )}
      {errorMessage && <p>{errorMessage}</p>}
      <div className='flex w-full flex-col gap-4'>
        {!loading &&
          !errorMessage &&
          templates.map((template) => {
            return <TemplateContainer key={template.id} template={template} />;
          })}
      </div>
    </div>
  );
};

export default Templates;
