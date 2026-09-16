'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';
import { Plan } from '@/lib/integrations/contracts';

import PlanEditor from '@/components/integrations/PlanEditor';
import TrainingContext from '@/components/integrations/TrainingContext';
import { Calendar } from '@/components/ui/Calendar';

export default function PlannedWorkouts({
  compact = false,
  selectedDate,
}: {
  compact?: boolean;
  selectedDate?: Date | null;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    let live = true;
    agentRequest<Plan[]>('list_plans', { limit: 50, status: 'pending' })
      .then((p) => {
        if (live) {
          setPlans(p);
          setMore(p.length === 50);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  const filter = selectedDate || date;
  const pending = plans.filter((p) => !p.workout_id);
  const shown = pending.filter(
    (p) =>
      !filter ||
      (p.definition.scheduled_at &&
        new Date(p.definition.scheduled_at).toDateString() ===
          filter.toDateString())
  );
  async function loadMore() {
    try {
      const data = await agentRequest<Plan[]>('list_plans', {
        limit: 50,
        status: 'pending',
        after: plans[plans.length - 1].id,
      });
      setPlans([...plans, ...data]);
      setMore(data.length === 50);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className='space-y-4 rounded-xl bg-white p-4 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-xl font-semibold'>Geplante Workouts</h2>
        <Link
          className='underline'
          href={compact ? '/dashboard/plans' : '/dashboard/connections'}
        >
          {compact ? 'Alle Pläne & Kalender' : 'Agenten & Verbindungen'}
        </Link>
      </div>
      {loading && <p>Lade Pläne …</p>}
      {error && <p role='alert'>{error}</p>}
      {!compact && selectedDate === undefined && (
        <>
          <Calendar
            weekStartsOn={1}
            modifiers={{
              planned: pending.flatMap((p) =>
                p.definition.scheduled_at
                  ? [new Date(p.definition.scheduled_at)]
                  : []
              ),
            }}
            modifiersStyles={{ planned: { backgroundColor: '#ccfbf1' } }}
            onDayClick={setDate}
          />
          {date && (
            <button onClick={() => setDate(null)}>Alle Termine anzeigen</button>
          )}
        </>
      )}
      <ul className='space-y-2'>
        {(compact ? shown.slice(0, 3) : shown).map((p) => (
          <li key={p.id}>
            <Link
              className='block rounded-lg border p-3 hover:bg-teal-50'
              href={'/dashboard/plans/' + p.id}
            >
              <strong>{p.definition.name}</strong>
              <p className='text-sm'>
                {p.definition.scheduled_at
                  ? new Date(p.definition.scheduled_at).toLocaleString('de-DE')
                  : 'Ohne festen Termin'}{' '}
                · {p.definition.items.length} Übungen
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && !error && !shown.length && (
        <p>Keine geplanten Workouts{filter ? ' an diesem Tag' : ''}.</p>
      )}
      {more && (
        <button className='rounded border p-2' onClick={loadMore}>
          Weitere Pläne laden
        </button>
      )}
      {!compact && selectedDate === undefined && (
        <>
          <button
            className='rounded border p-2'
            onClick={() => setCreating(!creating)}
          >
            {creating ? 'Editor schließen' : 'Workout selbst planen'}
          </button>
          {creating && (
            <PlanEditor
              onSaved={(p) => {
                setPlans([...plans, p]);
                setCreating(false);
              }}
            />
          )}
          <TrainingContext />
        </>
      )}
    </section>
  );
}
