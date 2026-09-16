import { z } from 'zod';

import { Operation, toolScopes } from '@/lib/integrations/contracts';
import { rpcSchema, toolsFor } from '@/lib/integrations/mcp';
import {
  ApiError,
  config,
  execute,
  failure,
  hash,
  json,
  readBody,
  rpc,
} from '@/lib/integrations/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'WWW-Authenticate',
};
export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}
export function GET() {
  return new Response(null, {
    status: 405,
    headers: { ...cors, Allow: 'POST, OPTIONS' },
  });
}
export async function POST(request: Request) {
  let id: string | number | undefined;
  try {
    const { origin, resource } = config();
    const browserOrigin = request.headers.get('origin');
    if (
      browserOrigin &&
      browserOrigin !== origin &&
      !(process.env.MCP_ALLOWED_ORIGINS || '')
        .split(',')
        .includes(browserOrigin)
    )
      throw new ApiError(403, 'Origin not allowed');
    const token = request.headers
      .get('authorization')
      ?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    const challenge = {
      ...cors,
      'WWW-Authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
    };
    if (!token) return json({ error: 'unauthorized' }, 401, challenge);
    let auth;
    try {
      auth = await rpc('gym_agent_execute', {
        op: 'introspect',
        a: { resource },
        token_hash: hash(token),
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        return json({ error: 'invalid_token' }, 401, challenge);
      throw e;
    }
    if (!request.headers.get('content-type')?.includes('application/json'))
      throw new ApiError(415, 'application/json required');
    const accept = request.headers.get('accept') || '';
    if (
      !accept.includes('application/json') ||
      !accept.includes('text/event-stream')
    )
      throw new ApiError(406, 'Accept application/json and text/event-stream');
    const version = request.headers.get('mcp-protocol-version');
    if (
      version &&
      !['2025-11-25', '2025-06-18', '2025-03-26'].includes(version)
    )
      throw new ApiError(400, 'Unsupported protocol version');
    const message = rpcSchema.parse(JSON.parse(await readBody(request)));
    id = message.id;
    if (id === undefined)
      return new Response(null, { status: 202, headers: cors });
    const reply = (result: unknown) =>
      json({ jsonrpc: '2.0', id, result }, 200, cors);
    if (message.method === 'initialize') {
      const requested = z
        .object({ protocolVersion: z.string() })
        .parse(message.params).protocolVersion;
      return reply({
        protocolVersion: ['2025-11-25', '2025-06-18', '2025-03-26'].includes(
          requested
        )
          ? requested
          : '2025-11-25',
        capabilities: { tools: {} },
        serverInfo: { name: 'kyx-gym', version: '1.0.0' },
        instructions:
          'Nur bestätigte Sätze als Leistung auswerten. Pläne und Begründungen sind Vorgaben, Feedback ist freiwilliger Kontext. Keine medizinischen Ursachen aus Abweichungen ableiten.',
      });
    }
    if (message.method === 'ping') return reply({});
    if (message.method === 'tools/list')
      return reply({ tools: toolsFor(auth.scopes) });
    if (message.method !== 'tools/call')
      return json(
        {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' },
        },
        200,
        cors
      );
    const call = z
      .object({ name: z.string(), arguments: z.unknown().optional() })
      .parse(message.params);
    if (!Object.prototype.hasOwnProperty.call(toolScopes, call.name))
      return json(
        {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Unknown tool' },
        },
        200,
        cors
      );
    try {
      const data = await execute(call.name as Operation, call.arguments || {}, {
        token_hash: hash(token),
      });
      const structured = {
        data,
        ...(call.name.includes('plan') && data?.id
          ? { url: origin + '/dashboard/plans/' + data.id }
          : {}),
        ...(call.name === 'create_cardio_session' && data?.id
          ? { url: origin + '/dashboard/cardio' }
          : {}),
      };
      return reply({
        content: [{ type: 'text', text: JSON.stringify(structured) }],
        structuredContent: structured,
        isError: false,
      });
    } catch (e) {
      return reply({
        content: [
          {
            type: 'text',
            text: e instanceof ApiError ? e.message : 'Invalid tool arguments',
          },
        ],
        isError: true,
      });
    }
  } catch (e) {
    if (id !== undefined && !(e instanceof ApiError))
      return json(
        {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Invalid params' },
        },
        200,
        cors
      );
    return failure(e);
  }
}
