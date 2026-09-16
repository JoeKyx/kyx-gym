'use client';
import { useEffect, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';

type Feedback = { difficulty: number | null; note: string; revision: number };
export default function WorkoutFeedback({ workoutId }: { workoutId: number }) {
  const [data, setData] = useState<Feedback>({
    difficulty: null,
    note: '',
    revision: 0,
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    agentRequest<Feedback | null>('get_feedback', { workout_id: workoutId })
      .then((d) => {
        if (live) {
          if (d) setData(d);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, [workoutId]);
  async function save() {
    setBusy(true);
    try {
      const d = await agentRequest<Feedback>('save_feedback', {
        workout_id: workoutId,
        ...data,
      });
      setData({ difficulty: d.difficulty, note: d.note, revision: d.revision });
      setMessage('Feedback gespeichert.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className='space-y-3 rounded-xl border bg-white p-4'>
      <h2 className='text-xl font-semibold'>
        Wie war dein Workout? (freiwillig)
      </h2>
      <p>
        Dein Feedback hilft deinem Agenten, zukünftige Vorgaben einzuordnen.
      </p>
      <label className='block'>
        Wie schwer war es?
        <select
          className='ml-2 rounded border p-2'
          value={data.difficulty ?? ''}
          onChange={(e) =>
            setData({
              ...data,
              difficulty: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value=''>Keine Angabe</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
              {i === 0 ? ' – sehr leicht' : i === 9 ? ' – sehr schwer' : ''}
            </option>
          ))}
        </select>
      </label>
      <label className='block'>
        Hast du etwas angepasst? Warum?
        <textarea
          className='mt-1 block w-full rounded border p-2'
          maxLength={2000}
          placeholder='Zum Beispiel: weniger Zeit, Gerät belegt, heute weniger Energie.'
          value={data.note}
          onChange={(e) => setData({ ...data, note: e.target.value })}
        />
      </label>
      <button
        className='rounded border p-2'
        disabled={!loaded || busy}
        onClick={save}
      >
        Feedback speichern
      </button>
      <p role='status'>{message}</p>
    </section>
  );
}
