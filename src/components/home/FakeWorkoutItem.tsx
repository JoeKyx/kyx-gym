import { FC, forwardRef } from 'react';
import { HTMLAttributes } from 'react';

import { Set } from '@/types/Workout';

type FakeWorkoutItemProps = HTMLAttributes<HTMLDivElement>;

const FakeWorkoutItem: FC<FakeWorkoutItemProps> = forwardRef<
  HTMLDivElement,
  FakeWorkoutItemProps
>((props, ref) => {
  const { className, ...rest } = props;

  const _set: Set = {
    id: 1,
    reps: 10,
    weight: 10,
    userid: '1',
    workout_item_id: 1,
    workout_id: 1,
    is_finished: false,
    distance: 0,
    finished_at: null,
    position: 1,
    type: 'normal',
    speed: 0,
  };

  return <div className={className} ref={ref} {...rest}></div>;
});

export default FakeWorkoutItem;
