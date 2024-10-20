import { FC, useState } from 'react';

import { cn, firstLetterUppercase } from '@/lib/utils';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

import { DBSet } from '@/types/Workout';

interface TypeDisplayProps {
  locked: boolean;
  set: DBSet;
  onSetChange?: (newType: DBSet['type']) => void;
  className?: string;
}

type SetType = NonNullable<DBSet['type']>;

const TypeDisplay: FC<TypeDisplayProps> = ({
  locked,
  set,
  onSetChange,
  className,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const availableTypes: SetType[] = [
    'normal',
    'drop',
    'warmup',
    'super',
    'insane',
  ];

  const typeColors: Record<SetType, string> = {
    normal: 'bg-primary-400',
    drop: 'bg-orange-400',
    warmup: 'bg-blue-400',
    super: 'bg-indigo-400',
    insane: 'bg-red-400',
  };

  const handleTypeChange = (type: SetType) => {
    if (onSetChange) onSetChange(type);
    setShowPopover(false);
  };

  return (
    <div className={className}>
      <Popover open={showPopover && !locked}>
        <PopoverTrigger>
          <div
            className={cn(
              typeColors[set.type],
              'border-primary-500 flex items-center justify-center rounded-sm border p-2 text-white',
              'flex h-7 w-7 items-center justify-center' // Fixed width and height
            )}
            onClick={() => {
              setShowPopover(true);
            }}
          >
            <span>{set.type ? set.type[0].toUpperCase() : 'Select Type'}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent onInteractOutside={() => setShowPopover(false)}>
          {availableTypes.map((type) => (
            <div
              key={type}
              onClick={() => handleTypeChange(type)}
              className='cursor-pointer p-2 hover:bg-gray-200'
            >
              {firstLetterUppercase(type)}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TypeDisplay;
