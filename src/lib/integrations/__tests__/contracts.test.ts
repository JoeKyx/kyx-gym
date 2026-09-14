import { inputs, performance, planSchema } from '@/lib/integrations/contracts';
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
  expect(write.map((t) => t.name)).toEqual(['create_plan', 'update_plan']);
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
