import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { scopes } from '@/lib/integrations/contracts';
import {
  ApiError,
  authorizationSchema,
  config,
  failure,
  hash,
  json,
  readBody,
  redirectAllowed,
  rpc,
  sameOrigin,
  secret,
  sessionUser,
} from '@/lib/integrations/server';

export const dynamic = 'force-dynamic';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}
async function authorization(url: URL) {
  const a = authorizationSchema.parse(Object.fromEntries(url.searchParams));
  if (
    a.resource !== config().resource ||
    a.scope
      .split(' ')
      .some((s) => !scopes.includes(s as (typeof scopes)[number]))
  )
    throw new ApiError(400, 'invalid_scope_or_resource');
  await rpc('gym_oauth', { op: 'client', a });
  return a;
}
export async function GET(
  request: Request,
  props: { params: Promise<{ action: string }> }
) {
  const params = await props.params;
  try {
    if (params.action === 'resume') {
      const target = (await cookies()).get('gym_oauth_return')?.value;
      if (target?.startsWith('/oauth/consent?')) {
        await authorization(new URL(target, config().origin));
        return NextResponse.redirect(new URL(target, config().origin));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (params.action !== 'authorize') return json({ error: 'not_found' }, 404);
    const url = new URL(request.url);
    await authorization(url);
    const target = '/oauth/consent?' + url.searchParams.toString();
    const response = NextResponse.redirect(new URL(target, config().origin));
    response.cookies.set('gym_oauth_return', target, {
      httpOnly: true,
      secure: config().origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  request: Request,
  props: { params: Promise<{ action: string }> }
) {
  const params = await props.params;
  try {
    if (params.action === 'register') {
      const a = z
        .object({
          client_name: z.string().trim().min(1).max(120),
          redirect_uris: z
            .array(z.string().url().max(2048).refine(redirectAllowed))
            .min(1)
            .max(5),
          token_endpoint_auth_method: z.literal('none').optional(),
          grant_types: z
            .array(z.enum(['authorization_code', 'refresh_token']))
            .optional(),
          response_types: z.array(z.literal('code')).optional(),
        })
        .parse(JSON.parse(await readBody(request)));
      const result = await rpc('gym_oauth', {
        op: 'register',
        a: { name: a.client_name, redirect_uris: a.redirect_uris },
      });
      return json(
        {
          ...result,
          ...a,
          token_endpoint_auth_method: 'none',
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
        },
        201,
        cors
      );
    }
    if (params.action === 'consent') {
      sameOrigin(request);
      const owner_id = await sessionUser();
      const body = z
        .object({
          query: z.string().max(6000),
          approved: z.boolean(),
          scopes: z.array(z.enum(scopes)).min(1).max(3),
        })
        .parse(JSON.parse(await readBody(request)));
      const a = await authorization(
        new URL('/?' + body.query, config().origin)
      );
      if (body.scopes.some((s) => !a.scope.split(' ').includes(s)))
        throw new ApiError(400, 'invalid_scope');
      const destination = new URL(a.redirect_uri);
      if (a.state !== undefined) destination.searchParams.set('state', a.state);
      if (!body.approved)
        destination.searchParams.set('error', 'access_denied');
      else {
        const code = secret();
        await rpc('gym_oauth', {
          op: 'authorize',
          owner_id,
          a: {
            ...a,
            scopes: body.scopes,
            challenge: a.code_challenge,
            code_hash: hash(code),
          },
        });
        destination.searchParams.set('code', code);
      }
      const response = json({ redirect: destination.href });
      response.cookies.delete('gym_oauth_return');
      return response;
    }
    if (params.action !== 'token') return json({ error: 'not_found' }, 404);
    const a = Object.fromEntries(new URLSearchParams(await readBody(request)));
    z.object({
      client_id: z.string().uuid(),
      resource: z.literal(config().resource),
      grant_type: z.enum(['authorization_code', 'refresh_token']),
    }).parse(a);
    const access = secret();
    const refresh = secret();
    let extra: Record<string, string>;
    if (a.grant_type === 'authorization_code') {
      z.object({
        code: z.string().min(32).max(128),
        code_verifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
        redirect_uri: z.string().url(),
      }).parse(a);
      extra = {
        code_hash: hash(a.code),
        challenge: hash(a.code_verifier),
        redirect_uri: a.redirect_uri,
      };
    } else {
      z.string().min(32).max(128).parse(a.refresh_token);
      extra = { refresh_hash: hash(a.refresh_token) };
    }
    let result;
    try {
      result = await rpc('gym_oauth', {
        op: a.grant_type === 'authorization_code' ? 'exchange' : 'refresh',
        a: {
          ...extra,
          client_id: a.client_id,
          resource: a.resource,
          access_hash: hash(access),
          new_refresh_hash: hash(refresh),
        },
      });
    } catch {
      return json({ error: 'invalid_grant' }, 400, cors);
    }
    if (result.error) return json({ error: 'invalid_grant' }, 400, cors);
    return json(
      {
        access_token: access,
        refresh_token: refresh,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: result.scope,
      },
      200,
      cors
    );
  } catch (e) {
    return failure(e);
  }
}
