// Local-only Supabase-compatible test adapter. Never connects to production.
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { Postgres } from './postgres-driver.mjs';
const db = new Postgres();
const uid = '00000000-0000-4000-8000-000000000001';
const user = {
  id: uid,
  email: 'alice@kyx.local',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  { alg: 'HS256', typ: 'JWT' },
  { ...user, sub: uid, exp: Math.floor(Date.now() / 1000) + 86400 },
  'fixture-signature',
]
  .map((x) =>
    Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString(
      'base64url'
    )
  )
  .join('.');
const session = {
  access_token: token,
  refresh_token: 'fixture-refresh',
  token_type: 'bearer',
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user,
};
writeFileSync(
  '/tmp/kyx-fixture-session.json',
  JSON.stringify({
    cookie: encodeURIComponent(JSON.stringify(session)),
    token,
  })
);
const profile = {
  userid: uid,
  username: 'alice',
  registered: new Date().toISOString(),
  public: false,
  isDefaultUsername: false,
  level: 1,
  exp: 0,
  icon: null,
  profile_icons: null,
};
const sql = async (q, a = []) => (await db.query(q, a)).rows;
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3017');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,DELETE,OPTIONS'
  );
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }
  const send = (data, status = 200) => {
    res
      .writeHead(status, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, 'http://127.0.0.1:55439');
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === '/auth/v1/user') {
      return req.headers.authorization?.endsWith(
        '.' + Buffer.from('fixture-signature').toString('base64url')
      )
        ? send(user)
        : send({ message: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/auth/v1/token') return send(session);
    if (url.pathname === '/auth/v1/settings')
      return send({
        external: { email: true, google: false },
        disable_signup: true,
        mailer_autoconfirm: true,
      });
    if (url.pathname === '/auth/v1/logout') return send({});
    const table = url.pathname.split('/').pop();
    const singular = (req.headers.accept || '').includes('vnd.pgrst.object');
    if (url.pathname.includes('/rpc/')) {
      if (table === 'get_latest_finished_sets') return send([]);
      if (
        !['gym_agent_execute', 'gym_cardio_execute', 'gym_oauth'].includes(
          table
        ) ||
        req.headers.authorization !== 'Bearer fixture-service'
      )
        return send({ code: '42501', message: 'Denied' }, 403);
      const row =
        table === 'gym_oauth'
          ? await sql('select gym_oauth($1,$2,$3) as data', [
              body.op,
              body.a,
              body.owner_id,
            ])
          : await sql(`select ${table}($1,$2,$3,$4) as data`, [
              body.op,
              body.a,
              body.owner_id,
              body.token_hash,
            ]);
      return send(row[0].data);
    }
    if (table === 'userprofile') return send(singular ? profile : [profile]);
    if (table === 'experience_level')
      return send([
        { level: 1, required_xp: 0 },
        { level: 2, required_xp: 100 },
      ]);
    if (table === 'exercise_categories')
      return send([{ id: 1, name: 'Kraft' }]);
    if (!['workouts', 'workout_items', 'sets', 'exercises'].includes(table))
      return send(singular ? null : []);
    let where = [];
    let args = [];
    for (const [k, v] of url.searchParams) {
      if (
        /^(id|userid|workout_id|workout_item_id|workout|status)$/.test(k) &&
        v.startsWith('eq.')
      ) {
        args.push(v.slice(3));
        where.push('"' + k + '"=$' + args.length);
      }
    }
    let rows;
    let updatedRows;
    if (req.method === 'PATCH') {
      const allowed =
        table === 'sets'
          ? [
              'weight',
              'reps',
              'distance',
              'speed',
              'is_finished',
              'type',
              'position',
            ]
          : ['name', 'status', 'finished_at'];
      const updates = Object.entries(body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v]) => {
          args.push(v);
          return '"' + k + '"=$' + args.length;
        });
      updatedRows = (
        await db.query(
          'update "' +
            table +
            '" set ' +
            updates.join(',') +
            (where.length ? ' where ' + where.join(' and ') : '') +
            ' returning *',
          args
        )
      ).rows;
    }
    if (req.method === 'PATCH')
      where = where.filter((clause) => !clause.startsWith('"status"'));
    rows =
      updatedRows ||
      (await sql(
        'select * from "' +
          table +
          '"' +
          (where.length ? ' where ' + where.join(' and ') : ''),
        args
      ));
    const fillExercise = async (e) => ({
      ...e,
      muscles: [],
      exercise_categories: { id: 1, name: 'Kraft' },
    });
    if (table === 'exercises') rows = await Promise.all(rows.map(fillExercise));
    if (
      table === 'workouts' &&
      url.searchParams.get('select')?.includes('workout_items')
    ) {
      rows = await Promise.all(
        rows.map(async (w) => ({
          ...w,
          workout_items: await Promise.all(
            (
              await sql(
                'select * from workout_items where workout=$1 order by position',
                [w.id]
              )
            ).map(async (wi) => ({
              ...wi,
              exercises: await fillExercise(
                (
                  await sql('select * from exercises where id=$1', [
                    wi.exerciseid,
                  ])
                )[0]
              ),
              sets: (
                await sql(
                  'select * from sets where workout_item_id=$1 order by position',
                  [wi.id]
                )
              ).map((s) => ({ ...s, records: [] })),
            }))
          ),
        }))
      );
    }
    send(singular ? rows[0] ?? null : rows);
  } catch (e) {
    const code = /42501|forbidden|private_owner|Denied|permission denied/.test(
      e.message
    )
      ? '42501'
      : /unauthorized/.test(e.message)
      ? '28000'
      : /conflict|already_started/.test(e.message)
      ? '40001'
      : 'P0001';
    send(
      {
        code,
        message: e.message.includes('rate_limited')
          ? 'rate_limited'
          : 'Fixture request failed',
      },
      400
    );
  }
});
server.listen(55439, '127.0.0.1', () =>
  console.log('Local synthetic Supabase fixture on 127.0.0.1:55439')
);
