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

    const dev = process.env.NODE_ENV === 'development';

    const [advice, setAdvice] = useState<Advice | null>(null);
    const [adviceText, setAdviceText] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [writing, setWriting] = useState<boolean>(false);
    const [generated, setGenerated] = useState<boolean>(false);

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
          setAdviceText(formattedAdvice(data?.advice));
          setLoading(false);
        }
      }
    }, [profileContext?.userProfile?.userid, profileContext?.workouts?.length]);

    useEffect(() => {
      getAdvice();
    }, [getAdvice]);

    // line breaks to <br> and ** to <strong>
    const formattedAdvice = (text: string) => {
      if (text) {
        // replace line breaks
        let formatted = text.replace(/\n/g, '<br>');
        // Text between **<text>** is bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        logger(formatted, 'formatted');
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
        `/api/advice/${profileContext.userProfile.userid}`,
        {
          method: 'GET',
        }
      );
      // body is a stream, content-type is text/plain charset=utf-8. Read the stream chunk by chunk and write to adviceText
      const reader = res.body?.getReader();
      let adviceTextFromStream = '';
      let chunk = await reader?.read();
      setLoading(false);
      setWriting(true);
      while (chunk?.done === false) {
        adviceTextFromStream += new TextDecoder('utf-8').decode(chunk?.value);
        chunk = await reader?.read();
        setAdviceText(formattedAdvice(adviceTextFromStream));
      }
      setWriting(false);
      setGenerated(true);
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

              {adviceText && !loading && (
                <div className='flex flex-grow  overflow-y-auto py-2'>
                  <p
                    className='text-sm text-gray-900'
                    dangerouslySetInnerHTML={{ __html: adviceText }}
                  ></p>
                </div>
              )}

              {(!advice ||
                differenceInDays(new Date(), new Date(advice.created_at)) > 3 ||
                dev) &&
              profileContext.isOwn &&
              !writing &&
              !generated ? (
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
                      {formatDistance(new Date(), new Date(advice.created_at))}{' '}
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
