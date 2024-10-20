import Image from 'next/image';
import React from 'react';

export interface SlideProps {
  imageSrc: string;
  heading: string;
  children: React.ReactNode;
  imageWidth: number;
  imageHeight: number;
  position: 'left' | 'right';
}

const Slide: React.FC<SlideProps> = ({
  imageSrc,
  heading,
  children,
  position,
  imageWidth,
  imageHeight,
}) => {
  return (
    <div className='flex items-center justify-between'>
      {position === 'left' && (
        <Image
          className='w-1/2'
          width={imageWidth}
          height={imageHeight}
          src={imageSrc}
          alt={heading}
        />
      )}
      <div className='p-10'>
        <h2 className='mb-4 text-3xl font-bold'>{heading}</h2>
        {children}
      </div>
      {position === 'right' && (
        <Image className='w-1/2' src={imageSrc} alt={heading} />
      )}
    </div>
  );
};

export default Slide;
