'use client';

import * as React from 'react';

import Heading from '@/components/text/Heading';

/**
 * SVGR Support
 * Caveat: No React Props Type.
 *
 * You can override the next-env if the type is important to you
 * @see https://stackoverflow.com/questions/68103844/how-to-override-next-js-svg-module-declaration
 */

// Before you begin editing, follow all comments with `STARTERCONF`,
// to customize the default configuration.

export default function HomePage() {
  return (
    <main className='mx-5 mt-28 flex flex-col'>
      <Heading size='default' className='md:text-center'>
        Welcome to Kyx Gym
      </Heading>
      {/* Create a Login Button */}
      {/* Create a Register Button */}
    </main>
  );
}
