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
        isDisabled?: boolean;
        onClickHandler: () => void;
      }
    | {
        image: string;
        title: string;
        isLoading?: boolean;
        isDisabled: true;
        onClickHandler?: never;
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
  } = props;

  const [zoomedIn, setZoomedIn] = useState(false);
  const [opacity, setOpacity] = useState('opacity-50');

  const handleZoom = () => {
    if (isDisabled) return;
    setZoomedIn(!zoomedIn);
    setOpacity(opacity === 'opacity-50' ? 'opacity-0' : 'opacity-50');
    onClickHandler();
  };

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'relative flex h-1/3 flex-1 flex-col items-center justify-center overflow-hidden rounded-md bg-black shadow-md transition-all duration-300 ease-in-out',
        isDisabled ? 'cursor-not-allowed bg-repeat opacity-60' : '',
        className
      )}
      style={{
        backgroundImage: `url(${image})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: zoomedIn ? '120%' : '100%',
      }}
      onClick={handleZoom}
    >
      <div className='flex flex-col items-center justify-center'>
        <span className='text-xl font-bold text-white '>{title}</span>

        <Loader2
          className={cn(
            'animate-spin text-white transition-all',
            isLoading ? 'visible' : 'invisible'
          )}
          size={40}
        />
      </div>
    </div>
  );
});

export default MobileImageButton;
