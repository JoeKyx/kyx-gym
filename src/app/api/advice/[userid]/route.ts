import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { differenceInDays } from 'date-fns';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdviceForUser } from '@/lib/adviceAi';
import logger from '@/lib/logger';

import { Database } from '@/types/supabase';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(
  request: Request,
  context: { params: { userid: string } }
) {
  logger('inc request');
  const userid = context.params.userid;
  logger(userid, 'userid');
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data, error } = await supabase
    .from('userprofile')
    .select('*')
    .eq('userid', userid)
    .single();
  logger(data, 'data');
  if (error) {
    logger(error, 'error');
    return NextResponse.json({
      status: 500,
      body: JSON.stringify({
        error: 'Sorry, Kyx AI has some problems. Try again later. (Code 0)',
      }),
    });
  }
  const { data: prevAdviceData, error: prevAdviceError } = await supabase
    .from('ai_advice')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('user_id', userid)
    .limit(1);
  if (prevAdviceError) {
    logger(prevAdviceError, 'error');
    return NextResponse.json({
      status: 500,
      body: JSON.stringify({
        error: 'Sorry, Kyx AI has some problems. Try again later. (Code 1)',
      }),
    });
  }
  const prevAdvice = prevAdviceData[0];

  // Check if prevAdvice is older than 3 days or if there is no prevAdvice
  let daysSincePrevAdvice = 4;
  if (prevAdvice) {
    daysSincePrevAdvice = differenceInDays(
      new Date(),
      new Date(prevAdvice.created_at)
    );
  }
  if (daysSincePrevAdvice > 3) {
    // Generate new advice
    try {
      const adviceStream = await getAdviceForUser(supabase, userid);
      const stream = OpenAIStream(adviceStream, {
        onCompletion: async (completion) => {
          logger(completion, 'completion');
          const { error } = await supabase.from('ai_advice').insert([
            {
              user_id: userid,
              advice: completion,
            },
          ]);
          if (error) {
            logger(error, 'error');
          }
        },
      });
      return new StreamingTextResponse(stream);
    } catch (e) {
      logger(e, 'error');
      return NextResponse.json({
        status: 500,
        body: JSON.stringify({ error: e }),
      });
    }
  } else {
    return { status: 403 };
  }
}
