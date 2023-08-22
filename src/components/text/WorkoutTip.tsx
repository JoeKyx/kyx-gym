// Tip.js
import { useEffect, useState } from 'react';

import { tips } from '@/data/tips';

export const WorkoutTip = () => {
  const [tipIndex, setTipIndex] = useState(
    Math.floor(Math.random() * tips.length)
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className='transition-opacity duration-500 will-change-contents'>
      {tips[tipIndex]}
    </div>
  );
};
