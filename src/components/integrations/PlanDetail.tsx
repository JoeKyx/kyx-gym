'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';
import { Plan } from '@/lib/integrations/contracts';

import PlanEditor from '@/components/integrations/PlanEditor';

export default function PlanDetail({ id }: { id: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let live = true;
    agentRequest<Plan>('get_plan', { id })
      .then((p) => {
        if (live) setPlan(p);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id]);
  async function start() {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      const p = await agentRequest<Plan>('start_plan', {
        id,
        revision: plan.revision,
      });
      setPlan(p);
      router.push('/dashboard/workout/' + p.workout_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!plan) return <p role='status'>{error || 'Lade Plan …'}</p>;
  return (
    <section className='space-y-5'>
      <h1 className='text-2xl font-bold'>{plan.definition.name}</h1>
      <p>
        {plan.definition.scheduled_at
          ? new Date(plan.definition.scheduled_at).toLocaleString('de-DE')
          : 'Ohne festen Termin'}
      </p>
      {plan.definition.rationale && (
        <div className='rounded bg-teal-50 p-4'>
          <h2 className='font-semibold'>Warum diese Vorgaben?</h2>
          <p className='whitespace-pre-wrap'>{plan.definition.rationale}</p>
        </div>
      )}
      <ol className='space-y-4'>
        {plan.definition.items.map((item, i) => (
          <li key={i} className='rounded border bg-white p-4'>
            <h2 className='font-semibold'>
              Übung {i + 1} ·{' '}
              {plan.exercise_names?.[String(item.exercise_id)] ||
                `ID ${item.exercise_id}`}
            </h2>
            <ul>
              {item.sets.map((s, j) => (
                <li key={j}>
                  Satz {j + 1}: {s.weight} kg × {s.reps} Wiederholungen
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p>
        Die Vorgaben werden übernommen. Kein Satz gilt vor deiner Bestätigung
        als erledigt. Deine tatsächlichen Werte werden getrennt gespeichert.
      </p>
      {error && (
        <p role='alert' className='text-red-700'>
          {error}{' '}
          <button
            className='underline'
            onClick={() => window.location.reload()}
          >
            Plan neu laden
          </button>
        </p>
      )}
      {plan.workout_id ? (
        <div>
          <p>Dieser Plan wurde gestartet und ist für Agenten gesperrt.</p>
          <Link
            className='underline'
            href={'/dashboard/workout/' + plan.workout_id}
          >
            Zum Workout
          </Link>
        </div>
      ) : (
        <div className='flex flex-wrap gap-3'>
          <button
            className='rounded bg-teal-700 px-4 py-3 text-white disabled:opacity-50'
            disabled={busy || edit}
            onClick={start}
          >
            Workout starten
          </button>
          <button
            className='rounded border p-3'
            disabled={busy}
            onClick={() => setEdit(!edit)}
          >
            {edit ? 'Editor schließen' : 'Plan bearbeiten'}
          </button>
        </div>
      )}
      {edit && !plan.workout_id && (
        <PlanEditor
          key={plan.revision}
          plan={plan}
          onSaved={(p) => {
            setPlan(p);
            setEdit(false);
          }}
        />
      )}
    </section>
  );
}
