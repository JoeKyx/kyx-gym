import Link from 'next/link';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';
import React from 'react';

import { cn } from '@/lib';

type NavPath = {
  name: string;
  href?: string;
};

type PathNavProps = HTMLAttributes<HTMLDivElement> & {
  paths: NavPath[];
};

const PathNav: FC<PathNavProps> = forwardRef<HTMLDivElement, PathNavProps>(
  (props, ref) => {
    const { className, paths, ...rest } = props;

    return (
      <div className={cn('flex gap-2', className)} ref={ref} {...rest}>
        {paths.map((path, index) => (
          <React.Fragment key={index}>
            {path.href ? (
              <Link
                className={
                  index === paths.length - 1
                    ? 'text-primary-500 hover:text-primary-600'
                    : 'hover:text-primary-600 text-gray-500'
                }
                href={path.href}
              >
                {path.name}
              </Link>
            ) : (
              <span
                className={
                  index === paths.length - 1
                    ? 'text-primary-500'
                    : 'text-gray-500'
                }
              >
                {path.name}
              </span>
            )}
            {index !== paths.length - 1 && (
              <span className='text-gray-500'>/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

export default PathNav;
