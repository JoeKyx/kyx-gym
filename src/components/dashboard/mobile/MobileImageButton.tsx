import { Loader2 } from 'lucide-react';
import { FC, forwardRef, useState } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

type MobileImageButtonProps = HTMLAttributes<HTMLDivElement> &
  (
    | {
        image: string;
        title: string;
        isLoading?: boolean;
        isDisabled?: never; // Using "never" to indicate that "isDisabled" should not be available in this variant.
        onClickHandler: () => void;
      }
    | {
        image: string;
        title: string;
        isLoading?: boolean;
        isDisabled: true; // Must be true if present
        onClickHandler?: never; // Using "never" to indicate that "onClickHandler" should not be available in this variant.
      }
  );

const MobileImageButton: FC<MobileImageButtonProps> = forwardRef<
  HTMLDivElement,
  MobileImageButtonProps
>((props, ref) => {
  const {
    className,
    title,
    image,
    onClickHandler,
    isLoading,
    isDisabled,
    ...rest
  } = props; // Extract isDisabled prop

  const [backgroundSize, setBackgroundSize] = useState('100%');
  const [opacity, setOpacity] = useState('opacity-50');

  const handleZoom = () => {
    if (isDisabled) return; // 3. Make click handler inert if isDisabled is true

    setBackgroundSize(backgroundSize === '100%' ? '120%' : '100%');
    setOpacity(opacity === 'opacity-50' ? 'opacity-0' : 'opacity-50');
    onClickHandler();
  };

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'relative flex h-1/3 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md shadow-md transition-all duration-300 ease-in-out',
        isDisabled ? 'cursor-not-allowed opacity-60' : '', // 2. Add styling when isDisabled is true
        className
      )}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize,
        backgroundPosition: 'center',
      }}
      onClick={handleZoom}
    >
      <div className='z-10 mt-10 flex flex-col items-center justify-center'>
        <span className='text-xl font-bold text-white '>{title}</span>

        <Loader2
          className={cn(
            'animate-spin text-white',
            isLoading ? 'visible' : 'invisible'
          )}
          size={40}
        />
      </div>
      <div
        className={cn(
          'absolute inset-0 bg-black transition-all duration-300 ease-in-out',
          opacity
        )}
      ></div>
    </div>
  );
});

export default MobileImageButton;
