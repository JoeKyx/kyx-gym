import { formatDistance } from 'date-fns';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import { ChallengeInformation } from '@/types/Challenge';

type ChallengeContainerProps = HTMLAttributes<HTMLDivElement> & {
  challenge: ChallengeInformation;
  finished?: boolean;
};

const ChallengeContainer: FC<ChallengeContainerProps> = forwardRef<
  HTMLDivElement,
  ChallengeContainerProps
>((props, ref) => {
  const { className, challenge, ...rest } = props;

  const backgroundColor = challenge.completed ? 'bg-white' : 'bg-white';

  const grayedOutImage = !challenge.completed ? 'filter grayscale' : '';

  const completedDateFormatted = challenge.completed_at
    ? new Date(challenge.completed_at).toLocaleDateString()
    : null;

  const distance = challenge.completed_at
    ? formatDistance(new Date(challenge.completed_at), new Date(), {
        addSuffix: true,
      })
    : null;

  return (
    <div
      className={cn(
        'rounded-lg, bg-white, w-full p-4 shadow-md',
        backgroundColor,
        className
      )}
      ref={ref}
      {...rest}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-3/5 flex-col'>
          <div className='flex items-center gap-2'>
            <span className='text-xl font-semibold'>
              {challenge.challenge.name}
            </span>
            {challenge.completed ? (
              <Check className='text-primary-500' size={24} />
            ) : null}
          </div>
          {challenge.completed ? (
            <span className='text-sm text-gray-500'>
              {completedDateFormatted} ({distance})
            </span>
          ) : null}
          <span className='text-sm text-gray-500 '>
            {challenge.challenge.points} Challenge Points
          </span>

          <span className='mt-2 text-sm'>
            {challenge.challenge.description}
          </span>
        </div>
        <div className='flex w-2/5 justify-end gap-2'>
          {challenge.challenge.profile_icons.map((profileIcon) => {
            return (
              <Image
                key={profileIcon.id}
                className={cn(
                  'border-primary-500 rounded-full border',
                  grayedOutImage
                )}
                src={`/images/avatars/${profileIcon.path}`}
                width={75}
                height={75}
                alt={`Profile Icon of the challenge: ${challenge.challenge.name}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ChallengeContainer;
