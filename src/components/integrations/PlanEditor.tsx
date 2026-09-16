'use client';
import { useRef, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';
import { Plan, PlanInput, planSchema } from '@/lib/integrations/contracts';

type Exercise = { id: number; name: string; type: string };
const empty: PlanInput = {
  name: '',
  scheduled_at: null,
  rationale: '',
  items: [],
};
export default function PlanEditor({
  plan,
  onSaved,
}: {
  plan?: Plan;
  onSaved: (plan: Plan) => void;
}) {
  const [draft, setDraft] = useState<PlanInput>(plan?.definition || empty);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const retry = useRef<{ payload: string; id: string } | null>(null);
  const changeItem = (i: number, item: PlanInput['items'][number]) =>
    setDraft({
      ...draft,
      items: draft.items.map((v, n) => (n === i ? item : v)),
    });
  async function save() {
    setError('');
    const parsed = planSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        'Bitte Name, mindestens eine Übung und gültige Satzvorgaben eingeben.'
      );
      return;
    }
    setBusy(true);
    try {
      const payload = JSON.stringify({ plan: draft, revision: plan?.revision });
      if (retry.current?.payload !== payload)
        retry.current = { payload, id: crypto.randomUUID() };
      const result = await agentRequest<Plan>(
        plan ? 'update_plan' : 'create_plan',
        {
          request_id: retry.current.id,
          plan: draft,
          ...(plan ? { id: plan.id, revision: plan.revision } : {}),
        }
      );
      retry.current = null;
      onSaved(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function search(after?: number) {
    try {
      const data = await agentRequest<Exercise[]>('search_exercises', {
        query,
        limit: 20,
        ...(after ? { after } : {}),
      });
      setResults(after ? [...results, ...data] : data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const input = 'w-full rounded border p-2';
  return (
    <section className='space-y-4 rounded-xl border bg-white p-4'>
      <h2 className='text-xl font-semibold'>
        {plan ? 'Plan bearbeiten' : 'Workout planen'}
      </h2>
      <label className='block'>
        Name
        <input
          className={input}
          value={draft.name}
          maxLength={120}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label className='block'>
        Termin (optional)
        <input
          className={input}
          type='datetime-local'
          value={
            draft.scheduled_at
              ? new Date(
                  new Date(draft.scheduled_at).getTime() -
                    new Date(draft.scheduled_at).getTimezoneOffset() * 60000
                )
                  .toISOString()
                  .slice(0, 16)
              : ''
          }
          onChange={(e) =>
            setDraft({
              ...draft,
              scheduled_at: e.target.value
                ? new Date(e.target.value).toISOString()
                : null,
            })
          }
        />
      </label>
      <label className='block'>
        Begründung der Vorgaben
        <textarea
          className={input}
          value={draft.rationale}
          maxLength={1500}
          onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
        />
      </label>
      {draft.items.map((item, i) => (
        <fieldset key={i} className='space-y-2 rounded border p-3'>
          <legend>
            Übung {i + 1} ·{' '}
            {results.find((e) => e.id === item.exercise_id)?.name ||
              plan?.exercise_names?.[String(item.exercise_id)] ||
              `ID ${item.exercise_id}`}
          </legend>
          <div className='flex gap-3'>
            <button
              disabled={i === 0 || busy}
              onClick={() => {
                const items = [...draft.items];
                [items[i - 1], items[i]] = [items[i], items[i - 1]];
                setDraft({ ...draft, items });
              }}
            >
              ↑ Nach oben
            </button>
            <button
              disabled={busy}
              onClick={() =>
                setDraft({
                  ...draft,
                  items: draft.items.filter((_, n) => n !== i),
                })
              }
            >
              Aus Plan entfernen
            </button>
          </div>
          {item.sets.map((set, j) => (
            <div key={j} className='flex flex-wrap items-end gap-2'>
              <span>Satz {j + 1}</span>
              <label className='min-w-0 flex-1'>
                Ziel kg
                <input
                  aria-label={`Übung ${i + 1} Satz ${j + 1} Ziel kg`}
                  className={input}
                  type='number'
                  min={0}
                  max={2000}
                  step='0.5'
                  value={set.weight}
                  onChange={(e) =>
                    changeItem(i, {
                      ...item,
                      sets: item.sets.map((s, n) =>
                        n === j ? { ...s, weight: Number(e.target.value) } : s
                      ),
                    })
                  }
                />
              </label>
              <label className='min-w-0 flex-1'>
                Ziel Wdh.
                <input
                  aria-label={`Übung ${i + 1} Satz ${
                    j + 1
                  } Ziel Wiederholungen`}
                  className={input}
                  type='number'
                  min={1}
                  max={1000}
                  value={set.reps}
                  onChange={(e) =>
                    changeItem(i, {
                      ...item,
                      sets: item.sets.map((s, n) =>
                        n === j ? { ...s, reps: Number(e.target.value) } : s
                      ),
                    })
                  }
                />
              </label>
              <button
                aria-label={`Satz ${j + 1} entfernen`}
                disabled={item.sets.length <= 1 || busy}
                className='p-2'
                onClick={() =>
                  changeItem(i, {
                    ...item,
                    sets: item.sets.filter((_, n) => n !== j),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            className='rounded border p-2'
            disabled={item.sets.length >= 30 || busy}
            onClick={() =>
              changeItem(i, {
                ...item,
                sets: [...item.sets, { ...item.sets[item.sets.length - 1] }],
              })
            }
          >
            Satz hinzufügen
          </button>
        </fieldset>
      ))}
      <div className='flex gap-2'>
        <input
          aria-label='Übungen suchen'
          className={input}
          placeholder='Übung suchen'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className='rounded border p-2' onClick={() => search()}>
          Suchen
        </button>
      </div>
      <ul className='space-y-2'>
        {results
          .filter((e) => ['weight', 'other'].includes(e.type))
          .map((e) => (
            <li key={e.id}>
              <button
                className='w-full rounded border p-2 text-left'
                disabled={draft.items.length >= 30 || busy}
                onClick={() =>
                  setDraft({
                    ...draft,
                    items: [
                      ...draft.items,
                      { exercise_id: e.id, sets: [{ weight: 0, reps: 8 }] },
                    ],
                  })
                }
              >
                + {e.name}
              </button>
            </li>
          ))}
      </ul>
      {results.length >= 20 && (
        <button onClick={() => search(results[results.length - 1].id)}>
          Weitere Übungen laden
        </button>
      )}
      {error && (
        <p role='alert' className='text-red-700'>
          {error}
        </p>
      )}
      <button
        className='rounded bg-teal-700 px-4 py-3 text-white disabled:opacity-50'
        disabled={busy}
        onClick={save}
      >
        {busy ? 'Speichert …' : 'Plan speichern'}
      </button>
    </section>
  );
}
