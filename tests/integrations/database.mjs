// Run: KYX_PGLITE_PATH=/path/to/pglite/dist/index.js node tests/integrations/database.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = process.env.KYX_TEST_POSTGRES
  ? new (await import('./postgres-driver.mjs')).Postgres()
  : new (
      await import(process.env.KYX_PGLITE_PATH || '@electric-sql/pglite')
    ).PGlite();
if (process.env.KYX_TEST_POSTGRES)
  await db.exec(
    'drop schema public cascade; create schema public; drop schema if exists auth cascade; drop role if exists anon; drop role if exists authenticated; drop role if exists service_role;'
  );
await db.exec(readFileSync('tests/integrations/fixture.sql', 'utf8'));
await db.exec(
  readFileSync('supabase/migrations/202609140001_agent_planning.sql', 'utf8')
);
await db.exec(
  readFileSync(
    'supabase/migrations/202609140002_workout_write_boundaries.sql',
    'utf8'
  )
);
const alice = '00000000-0000-4000-8000-000000000001',
  bob = '00000000-0000-4000-8000-000000000002';
await db.query('insert into auth.users values ($1),($2)', [alice, bob]);
await db.query(
  "insert into exercises(name,type,public,userid) values ('Bench','weight',true,null),('Private A','weight',false,$1),('Private B','weight',false,$2)",
  [alice, bob]
);
const run = async (op, a = {}, owner = alice, token = null) =>
  (
    await db.query('select gym_agent_execute($1,$2,$3,$4) as result', [
      op,
      a,
      owner,
      token,
    ])
  ).rows[0].result;
const oauth = async (op, a = {}, owner = null) =>
  (await db.query('select gym_oauth($1,$2,$3) as result', [op, a, owner]))
    .rows[0].result;
const key = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const plan = {
  name: 'Oberkörper morgen',
  scheduled_at: null,
  rationale: 'Zeitbudget und vorhandene Geräte berücksichtigt.',
  items: [
    {
      exercise_id: 1,
      sets: [
        { weight: 50, reps: 8 },
        { weight: 50, reps: 8 },
      ],
    },
  ],
};
let passed = 0;
async function check(name, fn) {
  await fn();
  console.log('PASS', name);
  passed++;
}
const p = await run('create_plan', { request_id: key(1), plan });
await check('Owner isolation and private exercise search', async () => {
  assert.deepEqual(
    (await run('search_exercises', { limit: 50 })).map((x) => x.id),
    [1, 2]
  );
  assert.deepEqual(await run('list_plans', {}, bob), []);
  await assert.rejects(run('get_plan', { id: p.id }, bob));
  await assert.rejects(
    run('create_plan', {
      request_id: key(2),
      plan: {
        ...plan,
        items: [{ exercise_id: 3, sets: [{ weight: 10, reps: 5 }] }],
      },
    })
  );
});
await check('Idempotency and payload conflict', async () => {
  assert.equal(
    (await run('create_plan', { request_id: key(1), plan })).id,
    p.id
  );
  await assert.rejects(
    run('create_plan', {
      request_id: key(1),
      plan: { ...plan, name: 'changed' },
    })
  );
});
await check(
  'Stale edit versus start, transactional complete start and repeat',
  async () => {
    const edited = await run('update_plan', {
      request_id: key(3),
      id: p.id,
      revision: 1,
      plan,
    });
    await assert.rejects(run('start_plan', { id: p.id, revision: 1 }));
    const started = await run('start_plan', {
      id: p.id,
      revision: edited.revision,
    });
    assert.equal(
      (await run('start_plan', { id: p.id, revision: 1 })).workout_id,
      started.workout_id
    );
    await assert.rejects(
      run('update_plan', { request_id: key(4), id: p.id, revision: 2, plan })
    );
    const w = await run('get_workout', { id: started.workout_id });
    assert.equal(w.items.length, 1);
    assert.equal(w.items[0].sets.length, 2);
    assert.equal(w.items[0].sets[0].actual, null);
    assert.equal(w.items[0].sets[0].target.weight, 50);
    assert.equal((await run('list_workouts'))[0].completed_volume, 0);
  }
);
await check(
  'Confirmed actual vs immutable targets and original plan',
  async () => {
    const started = await run('get_plan', { id: p.id });
    const w = await run('get_workout', { id: started.workout_id });
    const s = w.items[0].sets[0];
    await db.query(
      'update sets set weight=40,reps=8,is_finished=true where id=$1',
      [s.id]
    );
    const after = await run('get_workout', { id: w.id });
    assert.equal(after.items[0].sets[0].weight_delta, -10);
    assert.equal(after.original_plan.items[0].sets[0].weight, 50);
    assert.equal((await run('list_workouts'))[0].completed_volume, 320);
    await assert.rejects(
      db.query('update sets set target_weight=40 where id=$1', [s.id])
    );
    await db.query('delete from sets where id=$1', [s.id]);
    assert.equal(
      (await run('get_workout', { id: w.id })).original_plan.items[0].sets
        .length,
      2
    );
  }
);
await check(
  'Legacy finish cleanup preserves skipped planned sets and confirmed totals',
  async () => {
    const created = await run('create_plan', { request_id: key(91), plan });
    const started = await run('start_plan', { id: created.id, revision: 1 });
    const before = await run('get_workout', { id: started.workout_id });
    await db.query(
      'update sets set weight=40,reps=8,is_finished=true where id=$1',
      [before.items[0].sets[0].id]
    );
    await db.exec(
      `begin; set local role authenticated; set local request.jwt.claim.sub='${alice}'; update workouts set status='finished' where id=${started.workout_id}; commit;`
    );
    const after = await run('get_workout', { id: started.workout_id });
    assert.equal(after.status, 'finished');
    assert.equal(after.items[0].sets.length, 1);
    assert.equal(after.planned_sets.length, 2);
    assert.equal(after.planned_sets[0].actual.weight, 40);
    assert.equal(after.planned_sets[1].confirmed, false);
    assert.equal(after.planned_sets[1].actual, null);
    assert.equal(after.planned_sets[1].target.weight, 50);
  }
);
const exercise = {
  name: 'New version',
  type: 'weight',
  categoryid: 1,
  description: 'New',
  howto: 'Instructions',
  muscle_ids: [],
};
await check(
  'Exercise changes copy private owner version, never public or foreign',
  async () => {
    await assert.rejects(
      run('update_exercise', { request_id: key(5), id: 1, exercise })
    );
    await assert.rejects(
      run('update_exercise', { request_id: key(6), id: 3, exercise })
    );
    const e = await run('update_exercise', {
      request_id: key(7),
      id: 2,
      exercise,
    });
    assert.equal(e.public, false);
    assert.equal(
      (await db.query('select userid from exercises where id=$1', [e.id]))
        .rows[0].userid,
      alice
    );
    assert.notEqual(e.id, 2);
    assert.equal(
      (await db.query('select name from exercises where id=2')).rows[0].name,
      'Private A'
    );
    await assert.rejects(
      run('update_exercise', { request_id: key(8), id: 2, exercise })
    );
    await assert.rejects(
      db.query("update exercises set name='changed meaning' where id=1")
    );
  }
);
const client = await oauth('register', {
  name: 'Test agent',
  redirect_uris: ['http://127.0.0.1/callback'],
});
const authorization = {
  client_id: client.client_id,
  redirect_uri: 'http://127.0.0.1/callback',
  resource: 'https://gym.example/api/mcp',
  scopes: ['training.read'],
  challenge: 'challenge',
  code_hash: 'code',
};
const grant = await oauth('authorize', authorization, alice);
await check(
  'OAuth code binding, one use, scope restriction and resource binding',
  async () => {
    await assert.rejects(
      oauth('exchange', {
        ...authorization,
        challenge: 'wrong',
        access_hash: 'access',
        new_refresh_hash: 'refresh',
      })
    );
    await oauth('exchange', {
      ...authorization,
      access_hash: 'access',
      new_refresh_hash: 'refresh',
    });
    await assert.rejects(
      oauth('exchange', {
        ...authorization,
        access_hash: 'other',
        new_refresh_hash: 'other',
      })
    );
    assert.deepEqual(
      (
        await run(
          'introspect',
          { resource: authorization.resource },
          null,
          'access'
        )
      ).scopes,
      ['training.read']
    );
    await assert.rejects(
      run('introspect', { resource: 'https://other.example' }, null, 'access')
    );
    await assert.rejects(
      run('create_plan', { request_id: key(9), plan }, null, 'access')
    );
    await assert.rejects(
      run('start_plan', { id: p.id, revision: 2 }, null, 'access')
    );
    await assert.rejects(run('get_plan', { id: p.id }, null, 'invalid-token'));
  }
);
await check('Refresh rotation and immediate grant revocation', async () => {
  await oauth('refresh', {
    client_id: client.client_id,
    resource: authorization.resource,
    refresh_hash: 'refresh',
    access_hash: 'rotated',
    new_refresh_hash: 'rotated-refresh',
  });
  await assert.rejects(run('list_plans', {}, null, 'access'));
  await run('revoke_connection', { id: grant.grant_id }, bob);
  assert.ok(await run('list_plans', {}, null, 'rotated'));
  await run('revoke_connection', { id: grant.grant_id });
  await assert.rejects(run('list_plans', {}, null, 'rotated'));
  await assert.rejects(
    oauth('refresh', {
      client_id: client.client_id,
      resource: authorization.resource,
      refresh_hash: 'rotated-refresh',
      access_hash: 'bad',
      new_refresh_hash: 'bad',
    })
  );
});
await check(
  'Feedback only after completion, own user and optimistic revision',
  async () => {
    const w = (await run('list_workouts'))[0];
    await assert.rejects(
      run('save_feedback', {
        workout_id: w.id,
        revision: 0,
        difficulty: 8,
        note: 'Zeitdruck',
      })
    );
    await db.query("update workouts set status='finished' where id=$1", [w.id]);
    await assert.rejects(
      run(
        'save_feedback',
        { workout_id: w.id, revision: 0, difficulty: 8, note: 'Zeitdruck' },
        bob
      )
    );
    await run('save_feedback', {
      workout_id: w.id,
      revision: 0,
      difficulty: 8,
      note: 'Zeitdruck',
    });
    await assert.rejects(
      run('save_feedback', {
        workout_id: w.id,
        revision: 0,
        difficulty: 5,
        note: '',
      })
    );
    assert.equal(
      (await run('get_workout', { id: w.id })).feedback.note,
      'Zeitdruck'
    );
  }
);
await check('Direct authenticated SQL/RPC access denied', async () => {
  await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from gym_plans'));
  await assert.rejects(run('list_plans'));
  await assert.rejects(
    oauth('register', { name: 'bypass', redirect_uris: [] })
  );
  await db.exec('reset role');
});
await check(
  'Restrictive database policies reject forged owners and public exercises',
  async () => {
    await assert.rejects(
      db.exec(
        `begin;set local role authenticated;select set_config('request.jwt.claim.sub','${alice}',true);insert into workouts(name,status,userid) values('forged','active','${bob}');commit;`
      )
    );
    await db.exec('rollback');
    await assert.rejects(
      db.exec(
        `begin;set local role authenticated;select set_config('request.jwt.claim.sub','${alice}',true);insert into exercises(name,type,public,userid) values('public bypass','weight',true,'${alice}');commit;`
      )
    );
    await db.exec('rollback');
    await db.exec(
      `begin;set local role authenticated;select set_config('request.jwt.claim.sub','${alice}',true);insert into exercises(name,type,public,userid) values('private allowed','weight',false,'${alice}');rollback;`
    );
  }
);
await check(
  'Exercise muscle ownership and historical mapping boundaries',
  async () => {
    await db.query('insert into exercisemuscles values(1,1),(3,1)');
    await assert.rejects(
      db.exec(
        `begin; set local role authenticated; set local request.jwt.claim.sub='${alice}'; insert into exercisemuscles values(3,2); commit;`
      )
    );
    await db.exec('rollback');
    await assert.rejects(
      db.exec(
        `begin; set local role authenticated; set local request.jwt.claim.sub='${alice}'; insert into exercisemuscles values(1,2); commit;`
      )
    );
    await db.exec('rollback');
    await db.exec(
      `begin; set local role authenticated; set local request.jwt.claim.sub='${alice}'; insert into exercisemuscles values(2,2); rollback;`
    );
    assert.equal(
      (await run('list_plans', { status: 'pending' })).every(
        (p) => p.workout_id === null
      ),
      true
    );
    assert.equal(
      (await run('list_plans', { status: 'started' })).every(
        (p) => p.workout_id !== null
      ),
      true
    );
  }
);
await check(
  'Concurrent start versus update: one complete outcome',
  async () => {
    const q = await run('create_plan', { request_id: key(101), plan });
    const race = await Promise.allSettled([
      run('start_plan', { id: q.id, revision: 1 }),
      run('update_plan', {
        request_id: key(102),
        id: q.id,
        revision: 1,
        plan: { ...plan, name: 'changed' },
      }),
    ]);
    assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1);
    const after = await run('get_plan', { id: q.id });
    if (after.workout_id) assert.equal(after.definition.name, plan.name);
    else assert.equal(after.revision, 2);
  }
);
await check('Concurrent double start returns the same workout', async () => {
  const q = await run('create_plan', { request_id: key(103), plan });
  const [first, second] = await Promise.all([
    run('start_plan', { id: q.id, revision: 1 }),
    run('start_plan', { id: q.id, revision: 1 }),
  ]);
  assert.equal(first.workout_id, second.workout_id);
});
console.log(
  `${passed} database integration checks passed. Fixture excludes unknown production triggers/RLS.`
);
await db.close();
