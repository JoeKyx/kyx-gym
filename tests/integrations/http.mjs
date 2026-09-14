// Run only against the local app + synthetic Supabase fixture.
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const origin = 'http://localhost:3017',
  resource = origin + '/api/mcp';
const cookie =
  'sb-127-auth-token=' +
  JSON.parse(readFileSync('/tmp/kyx-fixture-session.json')).cookie;
const post = async (path, body, headers = {}) =>
  fetch(origin + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const oauth = (body) =>
  post('/api/oauth/consent', body, { Origin: origin, Cookie: cookie });
let checks = 0;
const pass = (name) => {
  checks++;
  console.log('PASS', name);
};
const metadata = await (
  await fetch(origin + '/.well-known/oauth-protected-resource')
).json();
assert.equal(metadata.resource, resource);
pass('Protected resource discovery');
const unauthorized = await post('/api/mcp', {});
assert.equal(unauthorized.status, 401);
assert.match(
  unauthorized.headers.get('www-authenticate'),
  /resource_metadata=/
);
pass('401 OAuth challenge');
for (const uri of [
  'javascript:alert(1)',
  'http://remote.example/callback',
  'https://safe.example/#fragment',
]) {
  assert.equal(
    (
      await post('/api/oauth/register', {
        client_name: 'Bad',
        redirect_uris: [uri],
      })
    ).status,
    400
  );
}
pass('Redirect URI validation');
const client = await (
  await post('/api/oauth/register', {
    client_name: 'OpenClaw local test',
    redirect_uris: ['http://127.0.0.1:47999/callback'],
    token_endpoint_auth_method: 'none',
  })
).json();
assert.ok(client.client_id);
const verifier = randomBytes(48).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const query = new URLSearchParams({
  response_type: 'code',
  client_id: client.client_id,
  redirect_uri: 'http://127.0.0.1:47999/callback',
  resource,
  code_challenge: challenge,
  code_challenge_method: 'S256',
  scope: 'training.read plans.write exercises.write',
  state: 'fixture-state',
}).toString();
const authorize = await fetch(origin + '/api/oauth/authorize?' + query, {
  redirect: 'manual',
});
assert.equal(authorize.status, 307);
assert.match(authorize.headers.get('location'), /\/oauth\/consent\?/);
assert.match(authorize.headers.get('set-cookie'), /gym_oauth_return/);
pass('Authorization sends user to browser consent and persists return path');
assert.equal(
  (
    await post(
      '/api/oauth/consent',
      { query, approved: true, scopes: ['training.read'] },
      { Cookie: cookie, Origin: 'https://attacker.example' }
    )
  ).status,
  403
);
pass('Consent CSRF origin rejected');
const consent = await oauth({
  query,
  approved: true,
  scopes: ['training.read', 'plans.write', 'exercises.write'],
});
assert.equal(consent.status, 200);
const destination = new URL((await consent.json()).redirect);
assert.equal(destination.searchParams.get('state'), 'fixture-state');
const code = destination.searchParams.get('code');
assert.ok(code);
const exchange = async (v) =>
  fetch(origin + '/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: client.client_id,
      redirect_uri: 'http://127.0.0.1:47999/callback',
      resource,
      code_verifier: v,
    }),
  });
assert.equal((await exchange('a'.repeat(43))).status, 400);
const issued = await exchange(verifier);
assert.equal(issued.status, 200);
const tokens = await issued.json();
assert.equal((await exchange(verifier)).status, 400);
pass('S256 code exchange and one-time code');
const rpc = async (method, params = {}, token = tokens.access_token) =>
  post(
    '/api/mcp',
    { jsonrpc: '2.0', id: 1, method, params },
    {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-11-25',
    }
  );
const init = await (
  await rpc('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'fixture', version: '1' },
  })
).json();
assert.equal(init.result.serverInfo.name, 'kyx-gym');
const tools = await (await rpc('tools/list')).json();
assert.ok(tools.result.tools.some((t) => t.name === 'create_plan'));
assert.ok(!tools.result.tools.some((t) => /delete|start_plan/.test(t.name)));
pass('MCP initialize and explicit scoped tools');
const request = {
  name: 'create_plan',
  arguments: {
    request_id: randomUUID(),
    plan: {
      name: 'Oberkörper morgen',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      rationale:
        'Kurzes Training mit Bank und Hanteln, passend zum Zeitbudget.',
      items: [
        {
          exercise_id: 1,
          sets: [
            { weight: 50, reps: 8 },
            { weight: 50, reps: 8 },
          ],
        },
      ],
    },
  },
};
const created = await (await rpc('tools/call', request)).json();
assert.equal(created.result.isError, false);
const plan = created.result.structuredContent.data;
assert.ok(plan.id);
assert.equal(
  created.result.structuredContent.url,
  origin + '/dashboard/plans/' + plan.id
);
const repeated = await (await rpc('tools/call', request)).json();
assert.equal(repeated.result.structuredContent.data.id, plan.id);
pass('MCP plan creation and repeated request idempotency');
const invalid = await (
  await rpc('tools/call', {
    ...request,
    arguments: { ...request.arguments, user_id: 'foreign' },
  })
).json();
assert.equal(invalid.result.isError, true);
pass('Tool schema rejects foreign identity injection');
const refresh = async (token) =>
  fetch(origin + '/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: client.client_id,
      resource,
      refresh_token: token,
    }),
  });
const rotation = await (await refresh(tokens.refresh_token)).json();
assert.ok(rotation.access_token);
assert.equal((await rpc('ping', {}, tokens.access_token)).status, 401);
assert.equal((await refresh(tokens.refresh_token)).status, 400);
assert.equal((await rpc('ping', {}, rotation.access_token)).status, 401);
pass('Refresh reuse detection revokes token family');
writeFileSync(
  '/tmp/kyx-fixture-plan.json',
  JSON.stringify({
    id: plan.id,
    url: origin + '/dashboard/plans/' + plan.id,
    authorize: origin + '/api/oauth/authorize?' + query,
    cookie,
  })
);
console.log(`${checks} local HTTP integration checks passed.`);
