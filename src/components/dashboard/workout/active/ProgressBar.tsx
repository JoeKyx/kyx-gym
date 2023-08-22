import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  percentageDone: number;
  text?: string;
};

const ProgressBar: FC<ProgressBarProps> = forwardRef<
  HTMLDivElement,
  ProgressBarProps
>((props, ref) => {
  const { className, percentageDone, text, ...rest } = props;

  return (
    <div className={cn('relative pt-1', className)} ref={ref} {...rest}>
      <div className='mb-2 flex items-center justify-between'>
        <div className='text-right'>
          <span className='text-primary-500 inline-block text-xs font-semibold'>
            {text ? text : null}
            {percentageDone}%
          </span>
        </div>
      </div>
      <div className='bg-primary-200 mb-4 flex h-2 overflow-hidden rounded text-xs'>
        <div
          style={{ width: `${percentageDone}%` }}
          className='bg-primary-500 flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none transition-all duration-300 ease-in-out'
        ></div>
      </div>
    </div>
  );
});

export default ProgressBar;
