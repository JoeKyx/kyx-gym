'use client';
import { useState } from 'react';

import { Scope } from '@/lib/integrations/contracts';

export const scopeLabels: Record<Scope, string> = {
  'training.read':
    'Eigene Trainings, Verlauf, Pläne, Feedback und Trainingsbedingungen lesen',
  'plans.write': 'Zukünftige Trainingspläne erstellen und bis zum Start ändern',
  'exercises.write':
    'Eigene private Übungen anlegen und als neue Version bearbeiten',
};
export default function Consent({
  name,
  query,
  requested,
}: {
  name: string;
  query: string;
  requested: Scope[];
}) {
  const [selected, setSelected] = useState<Scope[]>(requested);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function decide(approved: boolean) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/oauth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          approved,
          scopes: approved ? selected : requested,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      window.location.assign(result.redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Freigabe fehlgeschlagen.');
      setBusy(false);
    }
  }
  return (
    <section className='mx-auto max-w-xl space-y-5 rounded-xl bg-white p-6 shadow'>
      <h1 className='text-2xl font-bold'>Verbindung mit {name}</h1>
      <p>
        Diese Anwendung möchte mit deinem Kyx-Gym-Konto arbeiten. Wähle die
        erlaubten Funktionen. Du kannst die Verbindung jederzeit widerrufen.
      </p>
      {requested.map((scope) => (
        <label key={scope} className='flex gap-3'>
          <input
            type='checkbox'
            checked={selected.includes(scope)}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, scope]
                  : selected.filter((s) => s !== scope)
              )
            }
          />
          {scopeLabels[scope]}
        </label>
      ))}
      <p className='text-sm'>
        Gestartete und abgeschlossene Workouts bleiben für Agenten
        unveränderlich. Private Angaben werden nur mit dieser Freigabe gelesen.
      </p>
      {error && <p role='alert'>{error}</p>}
      <div className='flex gap-3'>
        <button
          className='rounded bg-teal-700 px-4 py-3 text-white'
          disabled={busy || !selected.length}
          onClick={() => decide(true)}
        >
          Verbindung erlauben
        </button>
        <button
          className='rounded border px-4 py-3'
          disabled={busy}
          onClick={() => decide(false)}
        >
          Ablehnen
        </button>
      </div>
    </section>
  );
}
