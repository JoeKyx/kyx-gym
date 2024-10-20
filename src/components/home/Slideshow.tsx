import React, { useRef, useState } from 'react';

import Slide from './Slide'; // Path to your Slide component

export interface SlideshowProps {
  slidesData: {
    imageSrc: string;
    heading: string;
    content: string;
    position: 'left' | 'right';
  }[];
}

const Slideshow: React.FC<SlideshowProps> = ({ slidesData }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slidesData.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slidesData.length) % slidesData.length
    );
  };

  return (
    <div className='relative h-[500px] w-full overflow-hidden'>
      <div
        className='absolute h-full w-full transform transition-transform duration-500 ease-in-out'
        style={{ left: `-${currentSlide * 100}%` }}
        ref={slideRef}
      >
        {slidesData.map((slide, idx) => (
          <Slide
            key={idx}
            imageSrc={slide.imageSrc}
            heading={slide.heading}
            position={slide.position}
            imageWidth={500}
            imageHeight={500}
          >
            <p>{slide.content}</p>
          </Slide>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className='absolute left-2 top-1/2 -translate-y-1/2 transform rounded-full bg-white p-2 shadow-md hover:bg-gray-200 focus:outline-none'
      >
        &#8678;
      </button>

      <button
        onClick={nextSlide}
        className='absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-white p-2 shadow-md hover:bg-gray-200 focus:outline-none'
      >
        &#8680;
      </button>
    </div>
  );
};

export default Slideshow;
