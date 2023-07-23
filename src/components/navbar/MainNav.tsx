import Image from 'next/image';
import React from 'react';

import PrimaryLink from '@/components/links/PrimaryLink';

export default function MainNav() {
  return (
    <div className='fixed left-4 right-4 top-5 z-50 mx-auto rounded-md bg-white p-3 opacity-75 shadow-lg'>
      <nav className='flex items-center justify-start gap-4'>
        <div>
          <Image
            priority
            src='/images/kgLogo.png'
            alt='Kyx Gym Logo'
            width={50}
            height={50}
          />
        </div>
        <div>
          <PrimaryLink href='/'>Home</PrimaryLink>
        </div>
        <div>
          <PrimaryLink href='/about'>About</PrimaryLink>
        </div>
        {/* Add more links as necessary */}
      </nav>
    </div>
  );
}
