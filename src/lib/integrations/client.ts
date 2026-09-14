import { Operation } from '@/lib/integrations/contracts';
export async function agentRequest<T>(
  action: Operation,
  input: unknown = {}
): Promise<T> {
  const response = await fetch('/api/agent/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Anfrage fehlgeschlagen.');
  return body;
}
