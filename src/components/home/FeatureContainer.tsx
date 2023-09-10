import { AlertTriangle, Check, HelpCircle, X } from 'lucide-react';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

export type Feature = {
  name: string;
  description: string;
  available: boolean | 'partial';
};

type FeatureContainerProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  description: string;
  costPerMonth: string;
  features: Feature[];
  preferable?: boolean;
};

const FeatureContainer: FC<FeatureContainerProps> = forwardRef<
  HTMLDivElement,
  FeatureContainerProps
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        className,
        'flex w-full  flex-col rounded-b-3xl rounded-r-3xl border-2 border-gray-400 bg-slate-100  drop-shadow-lg'
      )}
      ref={ref}
      {...rest}
    >
      <div className='flex flex-col items-center overflow-hidden py-4'>
        <h1 className='font-poppins text-center text-4xl font-bold drop-shadow-md'>
          {props.name}
        </h1>
        <p className='mt-2 text-center text-gray-500'>{props.description}</p>
      </div>
      {props.costPerMonth == '0€' ? (
        <div className='bg-primary-500 w-full border-y-2 border-gray-400 py-5'>
          <p className='text-center text-white'>
            All features are available for free!
          </p>
        </div>
      ) : (
        <div className='w-full border-y-2 border-gray-400 bg-red-400 py-5'>
          <p className='text-center text-white'>
            Features are often locked behind subscriptions
          </p>
        </div>
      )}
      <div className='flex flex-col gap-4 p-4'>
        {props.features.map((feature, index) => (
          <div key={index} className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <h3 className='font-poppins text-xl font-semibold'>
                {feature.name}
              </h3>
            </div>
            <div className='flex items-center gap-6'>
              {feature.description ? (
                <Popover>
                  <PopoverTrigger>
                    <HelpCircle className='h-6 w-6 text-gray-500' />
                  </PopoverTrigger>
                  <PopoverContent>
                    <span>{feature.description}</span>
                  </PopoverContent>
                </Popover>
              ) : null}
              {feature.available === true ? (
                <Check className='h-8 w-8 text-green-500' />
              ) : feature.available == 'partial' ? (
                <Popover>
                  <PopoverTrigger>
                    <AlertTriangle className='h-8 w-8 fill-white text-yellow-500' />
                  </PopoverTrigger>
                  <PopoverContent>
                    <span>Often hidden behind a subscription</span>
                  </PopoverContent>
                </Popover>
              ) : (
                <X className='h-8 w-8 text-red-500' />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default FeatureContainer;
