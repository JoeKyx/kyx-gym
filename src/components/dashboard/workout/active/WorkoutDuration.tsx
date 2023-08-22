import moment from 'moment';
import React, { useEffect, useState } from 'react';

export function WorkoutDuration({ createdAt }: { createdAt: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateDuration = () => {
      const start = moment(createdAt);
      const now = moment();
      const diff = moment.duration(now.diff(start));

      const hours = diff.hours();

      if (hours > 0) {
        setDuration(moment.utc(diff.asMilliseconds()).format('HH:mm:ss'));
      } else {
        setDuration(moment.utc(diff.asMilliseconds()).format('mm:ss'));
      }
    };

    updateDuration();

    // Update duration every second
    const intervalId = setInterval(updateDuration, 1000);

    return () => {
      // Clear the interval when the component unmounts
      clearInterval(intervalId);
    };
  }, [createdAt]);

  return <div>{duration}</div>;
}
