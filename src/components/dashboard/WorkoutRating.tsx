import { Star } from 'lucide-react';
import { FC, useState } from 'react';

import { cn } from '@/lib';
import { updateWorkoutInDB } from '@/lib/supabase-util';

import { DBWorkout, Workout } from '@/types/Workout';

interface WorkoutRatingProps {
  workout: Workout | DBWorkout;
  isOwnWorkout: boolean;
  className?: string;
}

const WorkoutRating: FC<WorkoutRatingProps> = ({
  workout,
  isOwnWorkout,
  className,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const [rating, setRating] = useState(workout.rating ?? 0);

  const handleRating = async (rating: 1 | 2 | 3 | 4 | 5) => {
    if (rating > 0 && rating <= 5 && workout.id) {
      setRating(rating);
      await updateWorkoutInDB({ rating }, workout.id);
    }
  };

  const stars = Array(5)
    .fill(false)
    .map((_, index) => (index < (rating ?? 0) ? rating : 0));

  const starColor = (index: number) => {
    if (isOwnWorkout && hoverIndex !== null) {
      if (index <= hoverIndex) {
        return index < (rating ?? 0) ? '#FFD700' : '#FFEA00';
      } else {
        return '#D1D5DB';
      }
    } else {
      return index < (rating ?? 0) ? '#FFD700' : '#D1D5DB';
    }
  };

  return (
    <div className={cn('mb-2 flex gap-1', className)}>
      <p className='hidden md:block'> Rating: </p>
      {stars.map((star, index) => (
        <Star
          key={index}
          size={24}
          color={starColor(index)}
          fill={starColor(index)}
          style={{ transition: 'fill 0.2s ease' }}
          className={isOwnWorkout ? 'cursor-pointer hover:fill-amber-500' : ''}
          onClick={
            isOwnWorkout
              ? () => handleRating((index + 1) as 1 | 2 | 3 | 4 | 5)
              : undefined
          }
          onMouseEnter={isOwnWorkout ? () => setHoverIndex(index) : undefined}
          onMouseLeave={isOwnWorkout ? () => setHoverIndex(null) : undefined}
        />
      ))}
    </div>
  );
};

export default WorkoutRating;
