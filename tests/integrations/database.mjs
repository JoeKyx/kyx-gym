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
await db.exec(
  readFileSync(
    'supabase/migrations/202609140003_legacy_trigger_search_path.sql',
    'utf8'
  )
);
await db.exec(
  readFileSync(
    'supabase/migrations/202609140004_explicit_conflict_errors.sql',
    'utf8'
  )
);
await db.exec(
  readFileSync(
    'supabase/migrations/202609140005_workout_chronology.sql',
    'utf8'
  )
);
await db.exec(
  readFileSync('supabase/migrations/20260916180415_cardio_sessions.sql', 'utf8')
);
await db.exec(
  readFileSync(
    'supabase/migrations/20260918040026_set_effort_and_exercise_history.sql',
    'utf8'
  )
);
await db.exec(
  readFileSync(
    'supabase/migrations/20260918041208_exercise_history_all_versions.sql',
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
const cardio = async (op, a = {}, owner = alice, token = null) =>
  (
    await db.query('select gym_cardio_execute($1,$2,$3,$4) as result', [
      op,
      a,
      owner,
      token,
    ])
  ).rows[0].result;
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
const functionDefinition = (
  await db.query(
    "select pg_get_functiondef('public.gym_agent_execute(text,jsonb,uuid,text)'::regprocedure) as definition"
  )
).rows[0].definition;
assert.ok(
  !functionDefinition.includes("errcode='40001'"),
  'Business conflicts must never trigger PostgREST transaction retries'
);
assert.ok(functionDefinition.includes("errcode='PT409'"));
let passed = 0;
async function check(name, fn) {
  await fn();
  console.log('PASS', name);
  passed++;
}
await check(
  'Cardio intervals are repeatable, private and idempotent',
  async () => {
    const session = {
      name: 'Intervalllauf',
      activity: 'running',
      status: 'completed',
      performed_at: new Date().toISOString(),
      rounds: 10,
      phases: [
        {
          name: 'Laufen',
          duration_seconds: 60,
          speed_kmh: 12,
          distance_km: null,
        },
        {
          name: 'Gehen',
          duration_seconds: 90,
          speed_kmh: 5,
          distance_km: null,
        },
      ],
      notes: '',
    };
    const input = { request_id: key(901), session };
    const created = await cardio('create_cardio_session', input);
    assert.equal(created.rounds, 10);
    assert.equal(created.phases.length, 2);
    assert.equal((await cardio('create_cardio_session', input)).id, created.id);
    assert.equal(
      (await cardio('get_cardio_session', { id: created.id })).id,
      created.id
    );
    assert.equal((await cardio('list_cardio_sessions', {})).length, 1);
    assert.deepEqual(await cardio('list_cardio_sessions', {}, bob), []);
    await assert.rejects(cardio('get_cardio_session', { id: created.id }, bob));
  }
);
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
    assert.equal(w.planned_sets[0].actual, null);
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
    assert.equal(after.planned_sets[0].actual.effort, null);
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
    const w = (await run('list_workouts')).find((w) => w.status === 'active');
    assert.ok(w, 'feedback test requires an active workout');
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
await check(
  'Workout chronology, date boundaries, tied cursors and owner isolation',
  async () => {
    const owner = '00000000-0000-4000-8000-000000000003';
    await db.query('insert into auth.users values ($1)', [owner]);
    // Deliberately non-chronological IDs, tied instants, different completion dates,
    // an active workout, null timestamps and an unreadable status.
    await db.query(
      `insert into workouts(id,name,status,userid,created_at,finished_at) values
    (9003,'old','finished',$1,'2026-01-01T00:00:00Z','2026-09-01T00:00:00Z'),
    (9001,'new','active',$1,'2026-03-01T00:00:00Z',null),
    (9004,'tie high','finished',$1,'2026-02-01T00:00:00Z',null),
    (9002,'tie low','finished',$1,'2026-02-01T01:00:00+01:00',null),
    (9006,'undated high','finished',$1,null,null),
    (9005,'undated low','finished',$1,null,null),
    (9007,'hidden','deleted',$1,'2026-04-01T00:00:00Z',null),
    (9008,'foreign','finished',$2,'2026-04-01T00:00:00Z',null)`,
      [owner, bob]
    );
    const list = (a) => run('list_workouts', a, owner);
    const ids = (rows) => rows.map((w) => w.id);
    assert.deepEqual(ids(await list({})), [9001, 9004, 9002, 9003, 9006, 9005]);
    const all = [];
    let after;
    do {
      const rows = await list({ limit: 1, ...(after ? { after } : {}) });
      if (!rows.length) break;
      all.push(...ids(rows));
      after = rows[rows.length - 1].id;
      assert.ok(all.length <= 6, 'cursor must progress');
    } while (true);
    assert.deepEqual(all, [9001, 9004, 9002, 9003, 9006, 9005]);
    const range = {
      from: '2026-02-01T01:00:00+01:00',
      to: '2026-03-01T00:00:00Z',
    };
    assert.deepEqual(ids(await list(range)), [9004, 9002]);
    assert.deepEqual(ids(await list({ ...range, limit: 1 })), [9004]);
    assert.deepEqual(ids(await list({ ...range, limit: 1, after: 9004 })), [
      9002,
    ]);
    assert.deepEqual(await list({ ...range, after: 9002 }), []);
    assert.deepEqual(ids(await list({ from: '2026-03-01T00:00:00Z' })), [9001]);
    assert.deepEqual(ids(await list({ to: '2026-02-01T00:00:00Z' })), [9003]);
    for (const args of [
      { from: range.to, to: range.from },
      { from: range.to, to: range.to },
      { from: 'not-a-date' },
      { after: 9008 },
      { after: 999999 },
      { after: 9007 },
    ])
      await assert.rejects(() => list(args));
    // A newer arrival between pages does not duplicate or displace older results.
    await db.query(
      "insert into workouts(id,name,status,userid,created_at) values (9009,'arrival','active',$1,'2026-05-01T00:00:00Z')",
      [owner]
    );
    assert.deepEqual(
      ids(await list({ after: 9001 })),
      [9004, 9002, 9003, 9006, 9005]
    );
  }
);
await check(
  'Per-set effort and exercise execution history stay scoped and chronological',
  async () => {
    const owner = '00000000-0000-4000-8000-000000000004';
    await db.query('insert into auth.users values ($1)', [owner]);
    await db.query(
      `insert into workouts(id,name,status,userid,created_at) values
      (9302,'older','finished',$1,'2026-01-01T00:00:00Z'),
      (9301,'newer','active',$1,'2026-03-01T00:00:00Z'),
      (9303,'foreign','finished',$2,'2026-04-01T00:00:00Z')`,
      [owner, bob]
    );
    await db.query(
      `insert into workout_items(id,exerciseid,workout,position,is_finished) values
      (9401,1,9301,1,true),(9402,1,9301,2,true),
      (9403,1,9302,1,true),(9404,2,9301,3,true),
      (9405,1,9303,1,true),(9406,1,9302,2,false)`
    );
    await db.query(
      `insert into sets(userid,workout_id,workout_item_id,position,type,is_finished,weight,reps,speed,distance,effort) values
      ($1,9301,9401,1,'normal',true,80,5,null,null,8.5),
      ($1,9301,9401,2,'normal',true,75,6,null,null,null),
      ($1,9301,9402,1,'normal',true,70,8,null,null,0),
      ($1,9302,9403,1,'normal',true,60,10,null,null,10),
      ($1,9301,9404,1,'normal',true,99,1,null,null,9),
      ($2,9303,9405,1,'normal',true,100,1,null,null,9),
      ($1,9302,9406,1,'normal',false,50,12,null,null,7)`,
      [owner, bob]
    );
    await assert.rejects(
      db.query('update sets set effort=10.1 where workout_item_id=9401')
    );
    await assert.rejects(
      db.query('update sets set effort=-0.1 where workout_item_id=9401')
    );
    const history = (args = {}, user = owner) =>
      run('exercise_history', { exercise_id: 1, ...args }, user);
    const executions = await history();
    assert.deepEqual(
      executions.map((row) => row.workout_item_id),
      [9402, 9401, 9403]
    );
    assert.deepEqual(
      executions[1].sets.map((set) => set.effort),
      [8.5, null]
    );
    assert.equal(executions[1].sets[0].weight, 80);
    assert.equal(executions[1].started_at, '2026-03-01T00:00:00+00:00');
    assert.deepEqual(
      (await history({ limit: 1 })).map((row) => row.workout_item_id),
      [9402]
    );
    assert.deepEqual(
      (await history({ limit: 1, after: 9402 })).map(
        (row) => row.workout_item_id
      ),
      [9401]
    );
    assert.deepEqual(
      (await history({ limit: 1, after: 9401 })).map(
        (row) => row.workout_item_id
      ),
      [9403]
    );
    assert.deepEqual(await history({ after: 9403 }), []);
    assert.deepEqual(
      (await history({}, bob)).map((row) => row.workout_item_id),
      [9405]
    );
    await assert.rejects(history({ after: 9405 }));
    await assert.rejects(history({ after: 9404 }));
    await assert.rejects(history({ after: 9406 }));
    const workout = await run('get_workout', { id: 9301 }, owner);
    assert.equal(workout.items[0].sets[0].actual.effort, 8.5);
    const sets = await run(
      'get_workout_sets',
      { workout_id: 9301, workout_item_id: 9401 },
      owner
    );
    assert.deepEqual(
      sets.map((set) => set.actual.effort),
      [8.5, null]
    );
  }
);
await check(
  'Exercise search resolves version families; no limit returns all and limit ten returns ten',
  async () => {
    const owner = '00000000-0000-4000-8000-000000000005';
    await db.query('insert into auth.users values ($1)', [owner]);
    await db.query(
      `insert into exercises(id,name,type,public,userid) values
      (9901,'Bench Legacy','weight',false,$1),
      (9902,'Bench Archive','weight',false,$1)`,
      [owner]
    );
    await db.query('insert into gym_exercise_versions values (9901,9902)');
    await db.query(
      `insert into workouts(id,name,status,userid,created_at)
      select 10000+g,'Workout '||g,'finished',$1,('2026-04-01'::date+g)::timestamptz
      from generate_series(1,25) g`,
      [owner]
    );
    await db.query(
      `insert into workout_items(id,exerciseid,position,workout,is_finished)
      select 11000+g,case when g<=10 then 9901 else 9902 end,1,10000+g,true
      from generate_series(1,25) g`
    );
    await db.query(
      `insert into sets(userid,workout_id,workout_item_id,position,type,is_finished,weight,reps,effort)
      select $1,10000+g,11000+g,1,'normal',true,50+g,5,g%11
      from generate_series(1,25) g`,
      [owner]
    );
    const found = await run(
      'search_exercises',
      { query: 'Bench Archive' },
      owner
    );
    assert.deepEqual(
      found.map((exercise) => exercise.id),
      [9902]
    );
    assert.deepEqual(
      (await run('search_exercises', { query: 'Bench Legacy' }, owner)).map(
        (exercise) => exercise.id
      ),
      [9902]
    );
    assert.equal(
      (await run('get_exercise', { id: 9902 }, owner)).previous_version_id,
      9901
    );
    assert.equal(
      (
        await db.query(
          "select has_function_privilege('authenticated','public.gym_exercise_family(bigint,uuid)','EXECUTE') as allowed"
        )
      ).rows[0].allowed,
      false
    );
    const history = (exercise_id, args = {}) =>
      run('exercise_history', { exercise_id, ...args }, owner);
    const all = await history(9902);
    assert.equal(all.length, 25);
    assert.deepEqual(
      all.map((row) => row.workout_item_id),
      Array.from({ length: 25 }, (_, i) => 11025 - i)
    );
    assert.deepEqual(
      [...new Set(all.map((row) => row.exercise_id))],
      [9902, 9901]
    );
    assert.equal((await history(9901)).length, 25);
    const latestTen = await history(9902, { limit: 10 });
    assert.deepEqual(
      latestTen.map((row) => row.workout_item_id),
      Array.from({ length: 10 }, (_, i) => 11025 - i)
    );
    assert.equal(
      (
        await history(9902, {
          limit: 10,
          after: latestTen.at(-1).workout_item_id,
        })
      ).length,
      10
    );
    assert.deepEqual(
      await run('exercise_history', { exercise_id: 9902 }, bob),
      []
    );
    await assert.rejects(history(9902, { after: 9401 }));
  }
);
console.log(
  `${passed} database integration checks passed. Fixture excludes unknown production triggers/RLS.`
);
await db.close();
