import { cva, VariantProps } from 'class-variance-authority';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface TitleProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof TitleVariants> {}

const TitleVariants = cva(
  'text-primary-500 text-center font-medium leading-relaxed tracking-wider py-3',
  {
    variants: {
      size: {
        default: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const Title: FC<TitleProps> = forwardRef<HTMLParagraphElement, TitleProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(TitleVariants({ size, className }))}
        {...props}
      >
        {children}
      </h1>
    );
  }
);

Title.displayName = 'Title';

export default Title;
