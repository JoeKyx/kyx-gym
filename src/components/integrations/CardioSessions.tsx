'use client';

import { useEffect, useRef, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';
import {
  CardioSession,
  CardioSessionInput,
} from '@/lib/integrations/contracts';

const emptyPhase = () => ({
  name: '',
  duration_seconds: 60,
  speed_kmh: null as number | null,
  distance_km: null as number | null,
});
const initial: CardioSessionInput = {
  name: 'Intervalllauf',
  activity: 'running',
  status: 'completed',
  performed_at: null,
  rounds: 10,
  phases: [
    {
      name: 'Laufen',
      duration_seconds: 60,
      speed_kmh: null,
      distance_km: null,
    },
    { name: 'Gehen', duration_seconds: 60, speed_kmh: null, distance_km: null },
  ],
  notes: '',
};
const activityNames: Record<CardioSessionInput['activity'], string> = {
  running: 'Laufen',
  cycling: 'Radfahren',
  rowing: 'Rudern',
  walking: 'Gehen',
  other: 'Sonstiges',
};

export default function CardioSessions() {
  const [session, setSession] = useState<CardioSessionInput>(initial);
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [performedAt, setPerformedAt] = useState('');
  const request = useRef<{
    id: string;
    payload: string;
    input: CardioSessionInput;
  } | null>(null);
  useEffect(() => {
    let live = true;
    agentRequest<CardioSession[]>('list_cardio_sessions', { limit: 20 })
      .then((data) => {
        if (live) {
          setSessions(data);
          setMore(data.length === 20);
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
  function updatePhase(
    index: number,
    patch: Partial<CardioSessionInput['phases'][number]>
  ) {
    setSession((current) => ({
      ...current,
      phases: current.phases.map((phase, i) =>
        i === index ? { ...phase, ...patch } : phase
      ),
    }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const input = {
        ...session,
        performed_at:
          session.status === 'completed'
            ? (performedAt ? new Date(performedAt) : new Date()).toISOString()
            : null,
      };
      const payload = JSON.stringify({ ...session, performed_at: performedAt });
      if (request.current?.payload !== payload)
        request.current = { id: crypto.randomUUID(), payload, input };
      const saved = await agentRequest<CardioSession>('create_cardio_session', {
        request_id: request.current.id,
        session: request.current.input,
      });
      request.current = null;
      setSessions((current) => [saved, ...current]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function loadMore() {
    try {
      const data = await agentRequest<CardioSession[]>('list_cardio_sessions', {
        after: sessions[sessions.length - 1].id,
        limit: 20,
      });
      setSessions((current) => [...current, ...data]);
      setMore(data.length === 20);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className='space-y-6'>
      <form
        onSubmit={save}
        className='space-y-4 rounded-xl bg-white p-4 shadow-sm'
      >
        <h1 className='text-xl font-semibold'>
          Ausdauer &amp; Intervalle erfassen
        </h1>
        <label className='block'>
          Name
          <input
            required
            maxLength={120}
            className='mt-1 w-full rounded border p-2'
            value={session.name}
            onChange={(e) => setSession({ ...session, name: e.target.value })}
          />
        </label>
        <div className='grid gap-3 sm:grid-cols-3'>
          <label>
            Sportart
            <select
              className='mt-1 w-full rounded border p-2'
              value={session.activity}
              onChange={(e) =>
                setSession({
                  ...session,
                  activity: e.target.value as CardioSessionInput['activity'],
                })
              }
            >
              {Object.entries(activityNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              className='mt-1 w-full rounded border p-2'
              value={session.status}
              onChange={(e) =>
                setSession({
                  ...session,
                  status: e.target.value as CardioSessionInput['status'],
                })
              }
            >
              <option value='completed'>Abgeschlossen</option>
              <option value='planned'>Geplant</option>
            </select>
          </label>
          <label>
            Runden
            <input
              required
              type='number'
              min={1}
              max={100}
              className='mt-1 w-full rounded border p-2'
              value={session.rounds}
              onChange={(e) =>
                setSession({ ...session, rounds: Number(e.target.value) })
              }
            />
          </label>
        </div>
        {session.status === 'completed' && (
          <label className='block'>
            Zeitpunkt (leer = jetzt)
            <input
              type='datetime-local'
              className='mt-1 w-full rounded border p-2'
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
            />
          </label>
        )}
        <p className='text-sm text-gray-600'>
          Die Phasen werden pro Runde in dieser Reihenfolge wiederholt. Für
          einen gleichmäßigen Lauf genügt eine Phase.
        </p>
        {session.phases.map((phase, index) => (
          <fieldset key={index} className='rounded-lg border p-3'>
            <legend className='px-1 font-medium'>Phase {index + 1}</legend>
            <div className='grid gap-3 sm:grid-cols-4'>
              <label>
                Bezeichnung
                <input
                  required
                  maxLength={120}
                  className='mt-1 w-full rounded border p-2'
                  value={phase.name}
                  onChange={(e) => updatePhase(index, { name: e.target.value })}
                />
              </label>
              <label>
                Dauer (Sekunden)
                <input
                  required
                  type='number'
                  min={1}
                  max={86400}
                  className='mt-1 w-full rounded border p-2'
                  value={phase.duration_seconds}
                  onChange={(e) =>
                    updatePhase(index, {
                      duration_seconds: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Tempo (km/h)
                <input
                  type='number'
                  step='0.1'
                  min='0.1'
                  max={100}
                  className='mt-1 w-full rounded border p-2'
                  value={phase.speed_kmh ?? ''}
                  onChange={(e) =>
                    updatePhase(index, {
                      speed_kmh: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label>
                Distanz (km)
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  max={1000}
                  className='mt-1 w-full rounded border p-2'
                  value={phase.distance_km ?? ''}
                  onChange={(e) =>
                    updatePhase(index, {
                      distance_km: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </label>
            </div>
            {session.phases.length > 1 && (
              <button
                type='button'
                className='mt-2 text-sm underline'
                onClick={() =>
                  setSession({
                    ...session,
                    phases: session.phases.filter((_, i) => i !== index),
                  })
                }
              >
                Phase entfernen
              </button>
            )}
          </fieldset>
        ))}
        {session.phases.length < 20 && (
          <button
            type='button'
            className='rounded border p-2'
            onClick={() =>
              setSession({
                ...session,
                phases: [...session.phases, emptyPhase()],
              })
            }
          >
            Phase hinzufügen
          </button>
        )}
        <label className='block'>
          Notizen
          <textarea
            maxLength={2000}
            className='mt-1 w-full rounded border p-2'
            value={session.notes}
            onChange={(e) => setSession({ ...session, notes: e.target.value })}
          />
        </label>
        {error && (
          <p role='alert' className='text-red-700'>
            {error}
          </p>
        )}
        <button
          disabled={saving}
          className='rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50'
        >
          {saving ? 'Speichere …' : 'Einheit speichern'}
        </button>
      </form>
      <section className='space-y-3 rounded-xl bg-white p-4 shadow-sm'>
        <h2 className='text-xl font-semibold'>Meine Ausdauereinheiten</h2>
        {loading && <p>Lade Einheiten …</p>}
        {!loading && !sessions.length && <p>Noch keine Einheiten vorhanden.</p>}
        {sessions.map((entry) => (
          <article key={entry.id} className='rounded-lg border p-3'>
            <h3 className='font-semibold'>{entry.name}</h3>
            <p className='text-sm text-gray-600'>
              {activityNames[entry.activity]} ·{' '}
              {entry.status === 'completed' ? 'Abgeschlossen' : 'Geplant'} ·{' '}
              {entry.rounds} {entry.rounds === 1 ? 'Runde' : 'Runden'} ·{' '}
              {new Date(entry.performed_at || entry.created_at).toLocaleString(
                'de-DE'
              )}
            </p>
            <ol className='mt-2 list-inside list-decimal text-sm'>
              {entry.phases.map((phase, i) => (
                <li key={i}>
                  {phase.name}: {phase.duration_seconds} s
                  {phase.speed_kmh != null ? ` · ${phase.speed_kmh} km/h` : ''}
                  {phase.distance_km != null
                    ? ` · ${phase.distance_km} km`
                    : ''}
                </li>
              ))}
            </ol>
            {entry.notes && <p className='mt-2 text-sm'>{entry.notes}</p>}
          </article>
        ))}
        {more && (
          <button className='rounded border p-2' onClick={loadMore}>
            Weitere Einheiten laden
          </button>
        )}
      </section>
    </div>
  );
}
