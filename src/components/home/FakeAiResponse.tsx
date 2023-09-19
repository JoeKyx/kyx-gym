'use client';
import { BrainCircuit } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';
import { HTMLAttributes } from 'react';
import TypeWriter from 'typewriter-effect';

import { cn } from '@/lib';

import { mockAiResponse } from '@/data/mockWorkouts';

import Button from '@/components/buttons/Button';

type FakeAiResponseProps = HTMLAttributes<HTMLDivElement>;

const FakeAiResponse: FC<FakeAiResponseProps> = forwardRef<
  HTMLDivElement,
  FakeAiResponseProps
>((props, ref) => {
  const { className, ...rest } = props;

  const [hydrated, setHydrated] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-96 flex-col gap-10 drop-shadow-lg  md:flex-row',
        className
      )}
      ref={ref}
      {...rest}
    >
      <div className='mx-auto my-auto w-40'>
        <Button leftIcon={BrainCircuit} onClick={() => setButtonPressed(true)}>
          Ask KyxAI
        </Button>
      </div>
      <div className='h-96 w-full overflow-auto rounded-lg bg-gradient-to-b from-slate-50 to-slate-200 p-6'>
        <h1 className='font-poppins'>
          <span className='text-primary-500'>Kyx</span>AI:
        </h1>
        <div>
          {buttonPressed && (
            <TypeWriter
              options={{ delay: 15, deleteSpeed: 1 }}
              onInit={(typewriter) => {
                typewriter
                  .typeString(mockAiResponse)
                  .pauseFor(3000)
                  .deleteAll()
                  .typeString('Just kidding, <h3>Just go heavy</h3>')
                  .start();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default FakeAiResponse;
