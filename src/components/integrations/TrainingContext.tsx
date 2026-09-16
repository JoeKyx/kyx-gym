'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { agentRequest } from '@/lib/integrations/client';
import { contextSchema } from '@/lib/integrations/contracts';

type Context = z.infer<typeof contextSchema>;
type StoredContext = { context: Context; revision: number };
type Exercise = { id: number; name: string };
export default function TrainingContext() {
  const [data, setData] = useState<Context>({
    available_minutes: null,
    equipment: [],
    avoid_exercise_ids: [],
    notes: '',
  });
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  useEffect(() => {
    let live = true;
    agentRequest<StoredContext | null>('get_context')
      .then((d) => {
        if (live) {
          if (d) {
            setData(d.context);
            setRevision(d.revision);
          }
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  async function search() {
    try {
      setExercises(
        await agentRequest('search_exercises', { query, limit: 20 })
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function save() {
    setBusy(true);
    try {
      const cleaned = {
        ...data,
        equipment: data.equipment.map((s) => s.trim()).filter(Boolean),
      };
      const parsed = contextSchema.safeParse(cleaned);
      if (!parsed.success) {
        setMessage('Bitte prüfe Zeitbudget, Geräte und Hinweise.');
        return;
      }
      const result = await agentRequest<StoredContext>('save_context', {
        revision,
        context: parsed.data,
      });
      setData(result.context);
      setRevision(result.revision);
      setMessage('Trainingsbedingungen gespeichert.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className='rounded-xl border bg-white p-4'>
      <summary className='cursor-pointer text-lg font-semibold'>
        Meine Trainingsbedingungen
      </summary>
      <div className='mt-4 space-y-3'>
        <label className='block'>
          Verfügbare Minuten
          <input
            className='block w-full rounded border p-2'
            type='number'
            min={5}
            max={600}
            value={data.available_minutes ?? ''}
            onChange={(e) =>
              setData({
                ...data,
                available_minutes: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
          />
        </label>
        <label className='block'>
          Verfügbare Geräte (mit Komma trennen)
          <input
            className='block w-full rounded border p-2'
            value={data.equipment.join(',')}
            onChange={(e) =>
              setData({ ...data, equipment: e.target.value.split(',') })
            }
          />
        </label>
        <fieldset className='space-y-2'>
          <legend>Zu vermeidende Übungen</legend>
          <div className='flex gap-2'>
            <input
              aria-label='Zu vermeidende Übung suchen'
              className='min-w-0 flex-1 rounded border p-2'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className='rounded border p-2' onClick={search}>
              Suchen
            </button>
          </div>
          {exercises.map((ex) => (
            <label key={ex.id} className='flex gap-2'>
              <input
                type='checkbox'
                checked={data.avoid_exercise_ids.includes(ex.id)}
                onChange={(e) =>
                  setData({
                    ...data,
                    avoid_exercise_ids: e.target.checked
                      ? [...data.avoid_exercise_ids, ex.id]
                      : data.avoid_exercise_ids.filter((id) => id !== ex.id),
                  })
                }
              />
              {ex.name}
            </label>
          ))}
          {data.avoid_exercise_ids
            .filter((id) => !exercises.some((e) => e.id === id))
            .map((id) => (
              <p key={id}>
                Übung {id} vermeiden{' '}
                <button
                  className='underline'
                  onClick={() =>
                    setData({
                      ...data,
                      avoid_exercise_ids: data.avoid_exercise_ids.filter(
                        (i) => i !== id
                      ),
                    })
                  }
                >
                  Entfernen
                </button>
              </p>
            ))}
        </fieldset>
        <label className='block'>
          Weitere Hinweise
          <textarea
            className='block w-full rounded border p-2'
            maxLength={1500}
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
          />
        </label>
        <p className='text-sm'>
          Freiwilliger Kontext für deine Planung. Mit Lesefreigabe kann dein
          Agent diese Angaben berücksichtigen.
        </p>
        <button
          disabled={busy || !loaded}
          className='rounded border p-2'
          onClick={save}
        >
          Bedingungen speichern
        </button>
        <p role='status'>{message}</p>
      </div>
    </details>
  );
}
