// Tip.js
import { useEffect, useState } from 'react';

import { tips } from '@/data/tips';

type WorkoutTipProps = {
  textArray?: string[];
};

export const WorkoutTip = ({ textArray = tips }: WorkoutTipProps) => {
  const textToUse = textArray ? textArray : tips;

  const [tipIndex, setTipIndex] = useState(
    Math.floor(Math.random() * textToUse.length)
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTipIndex((prevIndex) => (prevIndex + 1) % textToUse.length);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [textToUse.length]);

  return (
    <div className='transition-opacity duration-500 will-change-contents'>
      {textToUse[tipIndex]}
    </div>
  );
};
