'use client';
import { useEffect, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';

type PlannedSet = {
  set_id: number;
  exercise_position: number;
  set_position: number;
  exercise: { name: string };
  target: { weight: number; reps: number };
  confirmed: boolean;
  actual: { weight: number; reps: number } | null;
};
export default function WorkoutPlanComparison({
  workoutId,
}: {
  workoutId: number;
}) {
  const [sets, setSets] = useState<PlannedSet[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    agentRequest<{ planned_sets: PlannedSet[] }>('get_workout', {
      id: workoutId,
    })
      .then((data) => {
        if (live) setSets(data.planned_sets);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [workoutId]);
  if (error) return <p role='status'>Planvergleich: {error}</p>;
  if (!sets.length) return null;
  return (
    <section className='space-y-3 rounded-xl border bg-white p-4'>
      <h2 className='text-xl font-semibold'>Dein Plan im Vergleich</h2>
      <p>
        Die ursprünglichen Vorgaben bleiben auch bei ausgelassenen oder
        entfernten Sätzen erhalten.
      </p>
      <ol className='space-y-2'>
        {sets.map((s) => (
          <li key={s.set_id} className='rounded border p-3'>
            <p className='font-semibold'>
              {s.exercise.name} · Satz {s.set_position + 1}
            </p>
            <p>
              Soll: {s.target.weight} kg × {s.target.reps}
            </p>
            <p>
              {s.confirmed && s.actual
                ? `Ist: ${s.actual.weight} kg × ${s.actual.reps}`
                : 'Nicht absolviert'}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
