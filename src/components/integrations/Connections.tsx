'use client';
import { useEffect, useState } from 'react';

import { agentRequest } from '@/lib/integrations/client';
import { Scope } from '@/lib/integrations/contracts';

import { scopeLabels } from '@/components/integrations/Consent';

type Connection = {
  id: string;
  name: string;
  scopes: Scope[];
  revoked_at: string | null;
};
export default function Connections({ url }: { url: string | null }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    let live = true;
    agentRequest<Connection[]>('list_connections')
      .then((data) => {
        if (live) {
          setConnections(data);
          setMore(data.length === 20);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  async function loadMore() {
    try {
      const rows = await agentRequest<Connection[]>('list_connections', {
        after: connections[connections.length - 1].id,
        limit: 20,
      });
      setConnections([...connections, ...rows]);
      setMore(rows.length === 20);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    try {
      await agentRequest('revoke_connection', { id });
      setConnections((current) =>
        current.map((c) =>
          c.id === id ? { ...c, revoked_at: new Date().toISOString() } : c
        )
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='space-y-6'>
      <section className='space-y-3 rounded-xl border bg-white p-5'>
        <h2 className='text-xl font-semibold'>OpenClaw verbinden</h2>
        <p>
          1. Kopiere die MCP-Adresse und füge in OpenClaw einen
          Remote-MCP-Server mit Streamable HTTP und OAuth hinzu.
        </p>
        <div className='flex flex-wrap gap-2'>
          <input
            aria-label='MCP-Adresse'
            className='min-w-0 flex-1 rounded border p-2'
            readOnly
            value={url || 'Noch nicht eingerichtet'}
          />
          <button
            disabled={!url}
            className='rounded border p-2'
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url || '');
                setCopied(true);
              } catch {
                setError(
                  'Kopieren nicht möglich. Bitte Adresse im Feld auswählen.'
                );
              }
            }}
          >
            {copied ? 'Kopiert' : 'Adresse kopieren'}
          </button>
        </div>
        <p>
          2. Melde dich im geöffneten Browser bei Kyx Gym an und wähle die
          erlaubten Funktionen.
        </p>
        <p>
          3. Bitte deinen Agenten beispielsweise: „Plane Oberkörper für morgen“.
          Öffne danach seinen Link zum Plan, prüfe die Vorgaben und starte das
          Workout selbst.
        </p>
        {url && (
          <details>
            <summary className='cursor-pointer'>
              Einrichtung über die OpenClaw-Kommandozeile
            </summary>
            <pre className='mt-3 overflow-x-auto rounded bg-slate-100 p-3 text-xs'>{`openclaw mcp set kyx '${JSON.stringify(
              {
                url,
                transport: 'streamable-http',
                auth: 'oauth',
                oauth: { scope: 'training.read plans.write exercises.write' },
              }
            )}'`}</pre>
          </details>
        )}
        <p className='text-sm text-slate-600'>
          Die Anleitung folgt der OpenClaw-Dokumentation. Ein erfolgreicher
          Verbindungsaufbau hängt von deiner OpenClaw-Version und der
          Serverfreischaltung ab.
        </p>
      </section>
      {error && (
        <p role='alert' className='rounded bg-amber-50 p-3'>
          {error}
        </p>
      )}
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Deine Verbindungen</h2>
        {more && <button onClick={loadMore}>Weitere Verbindungen laden</button>}
        {!connections.length && !error && <p>Noch keine Verbindungen.</p>}
        {connections.map((c) => (
          <article key={c.id} className='rounded-xl border bg-white p-4'>
            <h3 className='font-semibold'>{c.name}</h3>
            <ul className='my-3 list-inside list-disc text-sm'>
              {c.scopes.map((s) => (
                <li key={s}>{scopeLabels[s]}</li>
              ))}
            </ul>
            {c.revoked_at ? (
              <p>Widerrufen</p>
            ) : (
              <button
                disabled={busy}
                className='rounded border border-red-700 p-2 text-red-700'
                onClick={() => revoke(c.id)}
              >
                Verbindung widerrufen
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
