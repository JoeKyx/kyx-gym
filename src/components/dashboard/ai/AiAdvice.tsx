import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { differenceInDays, formatDistance } from 'date-fns';
import { BrainCog } from 'lucide-react';
import { FC, forwardRef, useCallback, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';
import logger from '@/lib/logger';

import { aiLoading } from '@/data/aiLoading';

import Button from '@/components/buttons/Button';
import { useProfile } from '@/components/context/ProfileContext';
import { WorkoutTip } from '@/components/text/WorkoutTip';

import { Database } from '@/types/supabase';
import { Advice } from '@/types/UserProfile';

type AiAdviceProps = HTMLAttributes<HTMLDivElement>;

const AiAdvice: FC<AiAdviceProps> = forwardRef<HTMLDivElement, AiAdviceProps>(
  (props, ref) => {
    const { className, ...rest } = props;

    const profileContext = useProfile();

    const [advice, setAdvice] = useState<Advice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getAdvice = useCallback(async () => {
      if (profileContext?.workouts?.length >= 3) {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase
          .from('ai_advice')
          .select('*')
          .eq('user_id', profileContext?.userProfile?.userid)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (error) {
          if (error.code === 'PGRST116') {
            setAdvice(null);
          } else {
            setError(error.message);
          }
        } else {
          setAdvice(data);
          setLoading(false);
        }
      }
    }, [profileContext?.userProfile?.userid, profileContext?.workouts?.length]);

    useEffect(() => {
      getAdvice();
    }, [getAdvice]);

    // line breaks to <br> and ** to <strong>
    const formattedAdvice = () => {
      if (advice?.advice) {
        // replace line breaks
        let formatted = advice.advice.replace(/\n/g, '<br>');
        // Text between **<text>** is bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return formatted;
      }
      return '';
    };

    const completed3Workouts =
      profileContext?.workouts?.filter(
        (workout) => workout.status === 'finished'
      ).length >= 3;

    const generateAdvice = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/advice/${profileContext?.userProfile?.userid}`,
        {
          method: 'GET',
        }
      );
      if (res.status === 200) {
        getAdvice();
      } else {
        logger(res, 'error');
        setError(res.statusText);
      }
    };

    return (
      <div
        className={cn(className, 'bg-white p-4 shadow-md ')}
        ref={ref}
        {...rest}
      >
        <div className='flex h-full flex-col'>
          <div className='mb-2 flex items-center justify-start gap-5'>
            <BrainCog className='text-primary-500' />
            <span className='text-xl'>KyxAi Advice</span>
          </div>
          {error && <p className='text-sm text-red-500'>{error}</p>}
          {!completed3Workouts && (
            <p className='text-sm text-gray-500'>
              You need to complete at least 3 workouts before you can generate
              AI advice. Please come back later
            </p>
          )}
          {completed3Workouts && (
            <div className='flex h-full max-h-96 flex-col'>
              <p className='text-sm text-gray-500'>
                Kyx AI will generate advice for you based on your previous
                workouts.
              </p>
              {(!advice?.advice || loading) && (
                <div className='flex flex-grow items-center justify-center '>
                  {loading && <WorkoutTip textArray={aiLoading} />}
                </div>
              )}

              {advice?.advice && !loading && (
                <div className='flex flex-grow  overflow-y-auto py-2'>
                  <p
                    className='text-sm text-gray-900'
                    dangerouslySetInnerHTML={{ __html: formattedAdvice() }}
                  ></p>
                </div>
              )}

              {(!advice ||
                differenceInDays(new Date(advice.created_at), new Date()) >
                  3) &&
              profileContext.isOwn ? (
                <Button
                  className='mt-4'
                  isLoading={loading}
                  onClick={generateAdvice}
                >
                  Generate Advice
                </Button>
              ) : (
                advice &&
                profileContext.isOwn && (
                  <div className='mt-2 flex flex-col'>
                    <p className='text-sm text-gray-500'>
                      Generated{' '}
                      {formatDistance(new Date(advice.created_at), new Date())}{' '}
                      ago
                    </p>
                    <p className='text-sm text-gray-500'>
                      You can generate a new advice every 3 days.
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default AiAdvice;
