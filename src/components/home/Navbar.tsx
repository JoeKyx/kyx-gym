import Image from 'next/image';
import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib';

import ButtonLink from '@/components/links/ButtonLink';

type NavbarProps = HTMLAttributes<HTMLDivElement>;

const Navbar: FC<NavbarProps> = forwardRef<HTMLDivElement, NavbarProps>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <nav
        className={cn(
          className,
          'sticky top-0 z-10 border-b border-gray-400 bg-white drop-shadow-md'
        )}
        ref={ref}
        {...rest}
      >
        <div className='mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-4'>
          <div className='flex items-center'>
            <ButtonLink variant='ghost' href='/'>
              Home
            </ButtonLink>
          </div>
          <div className='flex items-center gap-6'>
            <ButtonLink variant='ghost' href='/login'>
              Sign In
            </ButtonLink>
            <div className='flex items-center'>
              <span className='font-poppins text-xl font-bold'>
                <span className='text-primary-500'>Kyx</span> Gym
              </span>
              <Image
                src='/images/kgLogo.png'
                width={50}
                height={50}
                alt='logo of Kyx Gym'
              />
            </div>
          </div>
        </div>
      </nav>
    );
  }
);

export default Navbar;
