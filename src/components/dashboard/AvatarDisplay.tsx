import Image from 'next/image';
import { FC } from 'react';

import { cn } from '@/lib/utils';
interface AvatarDisplayProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

const AvatarDisplay: FC<AvatarDisplayProps> = ({
  imageUrl,
  alt,
  className,
}) => {
  // Merge the className with the default classes
  const classes = cn(
    'relative items-center h-12 w-12 rounded-full overflow-hidden object-cover object-center',
    className
  );

  return (
    <div className={classes}>
      <Image quality={100} fill alt={alt} src={imageUrl} />
    </div>
  );
};

export default AvatarDisplay;
