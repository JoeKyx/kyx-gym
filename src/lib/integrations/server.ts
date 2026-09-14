import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { inputs, Operation } from '@/lib/integrations/contracts';
import { syncCookies } from '@/lib/supabase-cookie-adapter';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
const serviceKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

export function config() {
  const url = process.env.MCP_PUBLIC_URL;
  if (!url || !serviceKey())
    throw new ApiError(
      503,
      'Agentenverbindungen sind noch nicht eingerichtet.'
    );
  const resource = new URL(url);
  if (
    resource.pathname !== '/api/mcp' ||
    resource.search ||
    resource.hash ||
    resource.username ||
    resource.password ||
    (resource.protocol !== 'https:' &&
      !(
        resource.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(resource.hostname)
      ))
  ) {
    throw new ApiError(503, 'Ungültige Serverkonfiguration.');
  }
  return { resource: resource.href, origin: resource.origin };
}
export function admin() {
  config();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey() || '',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  );
}
export const hash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');
export const secret = () => randomBytes(32).toString('base64url');
export async function rpc(
  name: 'gym_agent_execute' | 'gym_oauth',
  args: Record<string, unknown>
) {
  const { data, error } = await admin().rpc(name, args);
  if (error) {
    const status =
      error.message === 'rate_limited'
        ? 429
        : error.code === '28000'
        ? 401
        : error.code === '42501'
        ? 403
        : error.code === 'P0002'
        ? 404
        : ['PT409', '40001', '23505'].includes(error.code)
        ? 409
        : error.code === 'PGRST202'
        ? 503
        : 400;
    throw new ApiError(
      status,
      status === 503
        ? 'Datenbankmigration noch nicht verfügbar.'
        : status === 409
        ? 'Die Daten wurden inzwischen geändert. Bitte neu laden.'
        : 'Anfrage nicht erlaubt oder ungültig.'
    );
  }
  return data;
}
export async function sessionUser() {
  const cookieStore = await cookies();
  const db = createRouteHandlerClient({ cookies: syncCookies(cookieStore) });
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new ApiError(401, 'Bitte anmelden.');
  return user.id;
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== config().origin)
    throw new ApiError(403, 'Ungültiger Ursprung.');
}
export async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Leere Anfrage.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  let reading = true;
  while (reading) {
    const { done, value } = await reader.read();
    if (done) {
      reading = false;
      break;
    }
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      throw new ApiError(413, 'Anfrage zu groß.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}
export function failure(error: unknown) {
  return json(
    { error: error instanceof ApiError ? error.message : 'Ungültige Anfrage.' },
    error instanceof ApiError ? error.status : 400
  );
}
export async function execute(
  op: Operation,
  raw: unknown,
  auth: { owner_id: string } | { token_hash: string }
) {
  return rpc('gym_agent_execute', { op, a: inputs[op].parse(raw), ...auth });
}
export function redirectAllowed(value: string) {
  try {
    const u = new URL(value);
    return (
      !u.hash &&
      !u.username &&
      !u.password &&
      (u.protocol === 'https:' ||
        (u.protocol === 'http:' &&
          ['127.0.0.1', '[::1]', 'localhost'].includes(u.hostname)))
    );
  } catch {
    return false;
  }
}
export const authorizationSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().uuid(),
  redirect_uri: z.string().url().max(2048).refine(redirectAllowed),
  resource: z.string().url(),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal('S256'),
  state: z.string().max(2000).optional(),
  scope: z.string().min(1).max(200),
});
