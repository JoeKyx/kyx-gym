import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import FeatureContainer, { Feature } from '@/components/home/FeatureContainer';

type FeatureComparisonProps = HTMLAttributes<HTMLDivElement>;

const FeatureComparison: FC<FeatureComparisonProps> = forwardRef<
  HTMLDivElement,
  FeatureComparisonProps
>((props, ref) => {
  const { className, ...rest } = props;

  type GymApp = {
    name: string;
    description: string;
    features: Feature[];
  };

  const KyxGym: GymApp = {
    name: 'Kyx Gym',
    description: 'Developed with the user in mind.',
    features: [
      {
        name: 'Workout Tracking',
        description:
          'Track your workouts: Enter the exercises you have completed during workout and keep on track with your goals.',
        available: true,
      },
      {
        name: 'Templates',
        description:
          'Create templates for your workouts and use them to quickly create new workouts.',
        available: true,
      },
      {
        name: 'Statistics',
        description:
          'In depth statistics about your workouts. Which muscles do you workout the most? How are you progressing in certain exercises over time? Find it out!',
        available: true,
      },
      {
        name: 'Social',
        description: 'Follow your friends and see what they are up to!',
        available: true,
      },
      {
        name: 'AI Advice',
        description:
          'Let our AI analyze your workouts and give you advice on how to improve!',
        available: true,
      },

      {
        name: 'Level System',
        description: 'Level up by completing workouts and earn rewards!',
        available: true,
      },
      {
        name: 'Challenges',
        description:
          'Complete challenges during your workouts to earn rewards!',
        available: true,
      },
    ],
  };

  const _OtherGyms: GymApp = {
    name: 'Other Gym Apps',
    description: 'Hiding crucial features behind a paywall.',
    features: [
      { name: 'Workout Tracking', description: '', available: true },
      { name: 'Templates', description: '', available: true },
      { name: 'Statistics', description: '', available: 'partial' },
      { name: 'Social', description: '', available: 'partial' },
      { name: 'AI Advice', description: '', available: false },
      { name: 'Level System', description: '', available: false },
      { name: 'Challenges', description: '', available: false },
    ],
  };

  return (
    <div
      className={cn(
        className,
        'flex w-screen flex-col items-center justify-between gap-14 px-4 md:w-1/2 md:flex-row '
      )}
      ref={ref}
      {...rest}
    >
      <FeatureContainer
        name={KyxGym.name}
        description={KyxGym.description}
        costPerMonth='0€'
        features={KyxGym.features}
        preferable
      />
    </div>
  );
});

export default FeatureComparison;
