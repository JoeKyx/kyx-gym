import { cva, VariantProps } from 'class-variance-authority';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface HeadingProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof HeadingVariants> {}

const HeadingVariants = cva(
  'text-stone-800 text-center md:text-left font-extrabold leading-tight tracking-tighter drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]',
  {
    variants: {
      size: {
        default: 'text-4xl md:text-5xl lg:text-6xl',
        lg: 'text-5xl md:text-6xl lg:text-7xl',
        sm: 'text-2xl md:text-3xl lg:text-4xl',
        xs: 'text-xl md:text-xl lg:text-2xl',
        xxs: 'text-lg md:text-lg lg:text-xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const Heading: FC<HeadingProps> = forwardRef<
  HTMLParagraphElement,
  HeadingProps
>(({ className, size, children, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn(HeadingVariants({ size, className }))}
      {...props}
    >
      {' '}
      {children}
    </h1>
  );
});

Heading.displayName = 'Heading';

export default Heading;
