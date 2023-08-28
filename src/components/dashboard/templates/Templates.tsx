'use client';
import { Loader2Icon, Save } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { loadTemplatesFromDB } from '@/lib/supabase-util';

import IconButton from '@/components/buttons/IconButton';
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
    <div className='mt-4 flex flex-col gap-4 md:mx-10'>
      <div className='flex w-full flex-col bg-white p-4 shadow-md'>
        <PathNav
          paths={[
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Templates' },
          ]}
        />
        <h1 className='mt-4 text-2xl font-bold'>Templates</h1>
        <div className='flex flex-col gap-2'>
          <p className='text-sm'>
            Templates are workouts that you can use to create a new workout.
            They are useful for creating workouts that you do often.
          </p>
          <div className='flex items-center gap-2'>
            <IconButton
              variant='outline'
              className='mx-4 h-3 w-3 rounded-full'
              icon={Save}
            />
            <span>
              To save a workout as a template, click the "Save as Template"
              button after you have finished a workout.
            </span>
          </div>
        </div>
      </div>

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
