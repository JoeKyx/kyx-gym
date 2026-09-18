import {
  cardioSessionSchema,
  inputs,
  performance,
  planSchema,
} from '@/lib/integrations/contracts';
import { jsonSchema, toolsFor } from '@/lib/integrations/mcp';
import { totalWeightLifted } from '@/lib/workout-util';

import { DBSet } from '@/types/Workout';

const plan = {
  name: 'Oberkörper',
  scheduled_at: null,
  rationale: 'Zeitbudget',
  items: [{ exercise_id: 1, sets: [{ weight: 50, reps: 8 }] }],
};
it('rejects foreign identity, extra fields, non-finite values and unbounded plans', () => {
  expect(
    inputs.create_plan.safeParse({
      request_id: '10000000-0000-4000-8000-000000000001',
      plan,
      user_id: 'foreign',
    }).success
  ).toBe(false);
  expect(
    planSchema.safeParse({
      ...plan,
      items: [{ exercise_id: 1, sets: [{ weight: Infinity, reps: 8 }] }],
    }).success
  ).toBe(false);
  expect(
    planSchema.safeParse({
      ...plan,
      items: Array.from({ length: 31 }, () => plan.items[0]),
    }).success
  ).toBe(false);
  expect(inputs.list_workouts.safeParse({ limit: 51 }).success).toBe(false);
  expect(
    inputs.exercise_history.safeParse({ exercise_id: 1, limit: 51 }).success
  ).toBe(false);
  expect(inputs.exercise_history.parse({ exercise_id: 1 })).toEqual({
    exercise_id: 1,
  });
  expect(
    inputs.update_plan.safeParse({
      id: '10000000-0000-4000-8000-000000000001',
      plan,
    }).success
  ).toBe(false);
});
it('counts confirmed actuals only and retains target deviations', () => {
  const unconfirmed = {
    is_finished: false,
    weight: 50,
    reps: 8,
    target_weight: 50,
    target_reps: 8,
  } as DBSet;
  expect(performance(unconfirmed).actual).toBeNull();
  expect(performance(unconfirmed).weight_delta).toBeNull();
  expect(totalWeightLifted([unconfirmed])).toBe(0);
  const actual = { ...unconfirmed, is_finished: true, weight: 40 };
  expect(performance(actual)).toEqual({
    target: { weight: 50, reps: 8 },
    actual: { weight: 40, reps: 8 },
    weight_delta: -10,
    reps_delta: 0,
  });
  expect(totalWeightLifted([actual, unconfirmed])).toBe(320);
  expect(unconfirmed.target_weight).toBe(50);
});
it('advertises only allowed tools and never workout mutation or deletion', () => {
  const read = toolsFor(['training.read']);
  expect(read.some((t) => t.name === 'get_workout')).toBe(true);
  expect(read.some((t) => t.name === 'create_plan')).toBe(false);
  const write = toolsFor(['plans.write']);
  expect(write.map((t) => t.name)).toEqual([
    'create_cardio_session',
    'create_plan',
    'update_plan',
  ]);
  const all = toolsFor(['training.read', 'plans.write', 'exercises.write']);
  expect(all.some((t) => /delete|start_plan|save_feedback/.test(t.name))).toBe(
    false
  );
  for (const tool of all)
    expect(tool.inputSchema.additionalProperties).toBe(false);
  expect(jsonSchema(inputs.create_plan)).toMatchObject({
    required: ['request_id', 'plan'],
  });
});
it('accepts interval cycles and restricts invalid cardio measurements', () => {
  const session = {
    name: 'Zehn Laufintervalle',
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
      { name: 'Gehen', duration_seconds: 90, speed_kmh: 5, distance_km: null },
    ],
    notes: '',
  };
  expect(cardioSessionSchema.safeParse(session).success).toBe(true);
  expect(
    cardioSessionSchema.safeParse({ ...session, rounds: 101 }).success
  ).toBe(false);
  expect(
    cardioSessionSchema.safeParse({
      ...session,
      phases: [{ ...session.phases[0], speed_kmh: -1 }],
    }).success
  ).toBe(false);
  expect(
    inputs.create_cardio_session.safeParse({
      request_id: '10000000-0000-4000-8000-000000000001',
      session,
      user_id: 'foreign',
    }).success
  ).toBe(false);
  expect(
    toolsFor(['training.read']).some((t) => t.name === 'get_cardio_session')
  ).toBe(true);
});

it('validates workout date filters and advertises them to MCP clients', () => {
  expect(inputs.list_workouts.parse({})).toEqual({ limit: 20 });
  expect(
    inputs.list_workouts.safeParse({
      from: '2026-02-01T01:00:00+01:00',
      to: '2026-03-01T00:00:00Z',
      after: 5,
    }).success
  ).toBe(true);
  for (const args of [
    { from: '2026-02-30T00:00:00Z' },
    { to: '2026-13-01T00:00:00Z' },
    { from: '2026-02-01' },
    { from: '2026-02-01T00:00:00' },
    { to: 'yesterday' },
    { from: '2026-02-01T00:00:00+99:00' },
    { from: '2026-03-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
    { from: '2026-02-01T01:00:00+01:00', to: '2026-02-01T00:00:00Z' },
  ])
    expect(inputs.list_workouts.safeParse(args).success).toBe(false);
  expect(
    inputs.list_workouts.safeParse({
      from: '2026-02-01T00:00:00.000001Z',
      to: '2026-02-01T00:00:00.000002Z',
    }).success
  ).toBe(true);
  const tool = toolsFor(['training.read']).find(
    (t) => t.name === 'list_workouts'
  );
  expect(tool?.inputSchema).toMatchObject({
    properties: {
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
      after: { type: 'integer' },
    },
  });
  expect(tool?.description).toContain('created_at');
});
