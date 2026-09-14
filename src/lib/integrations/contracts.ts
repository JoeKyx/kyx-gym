import { z } from 'zod';

export const scopes = [
  'training.read',
  'plans.write',
  'exercises.write',
] as const;
export type Scope = (typeof scopes)[number];
const id = z.number().int().positive().safe();
const text = z.string().trim().min(1).max(120);
export const targetSchema = z
  .object({
    weight: z.number().finite().min(0).max(2000),
    reps: z.number().int().min(1).max(1000),
  })
  .strict();
export const planSchema = z
  .object({
    name: text,
    scheduled_at: z.string().datetime({ offset: true }).nullable(),
    rationale: z.string().trim().max(1500),
    items: z
      .array(
        z
          .object({
            exercise_id: id,
            sets: z.array(targetSchema).min(1).max(30),
          })
          .strict()
      )
      .min(1)
      .max(30),
  })
  .strict();
export type PlanInput = z.infer<typeof planSchema>;
export type Plan = {
  id: string;
  revision: number;
  workout_id: number | null;
  definition: PlanInput;
  created_at: string;
  exercise_names?: Record<string, string>;
};
export const contextSchema = z
  .object({
    available_minutes: z.number().int().min(5).max(600).nullable(),
    equipment: z.array(text).max(50),
    avoid_exercise_ids: z.array(id).max(100),
    notes: z.string().trim().max(1500),
  })
  .strict();
export const exerciseSchema = z
  .object({
    name: text,
    description: z.string().trim().max(2000),
    howto: z.string().trim().max(4000),
    categoryid: id,
    type: z.enum(['weight', 'other', 'speed', 'time']),
    muscle_ids: z.array(id).max(30),
  })
  .strict();
const key = z.string().uuid();
const page = {
  after: id.optional(),
  limit: z.number().int().min(1).max(50).default(20),
};
// Explicit offsets avoid interpreting an agent's local date in the server timezone.
const workoutDate = z
  .string()
  .datetime({ offset: true })
  .refine((value) => {
    const date = new Date(value);
    const fraction = value.match(/\.(\d+)/)?.[1] || '';
    const calendarDate = new Date(value.slice(0, 10) + 'T00:00:00Z');
    return (
      fraction.length <= 6 &&
      Number.isFinite(date.getTime()) &&
      Number.isFinite(calendarDate.getTime()) &&
      calendarDate.toISOString().slice(0, 10) === value.slice(0, 10)
    );
  }, 'Expected a real ISO 8601 timestamp with Z or an explicit UTC offset');
// Preserve PostgreSQL microsecond precision when validating a narrow range.
const workoutInstant = (value: string) =>
  BigInt(Date.parse(value)) * BigInt(1000) +
  BigInt((value.match(/\.(\d+)/)?.[1] || '').padEnd(6, '0').slice(3, 6));
export const inputs = {
  list_workouts: z
    .object({
      ...page,
      from: workoutDate.optional(),
      to: workoutDate.optional(),
    })
    .strict()
    .refine(
      ({ from, to }) =>
        !from ||
        !to ||
        (Number.isFinite(Date.parse(from)) &&
          Number.isFinite(Date.parse(to)) &&
          workoutInstant(from) < workoutInstant(to)),
      'from must be earlier than to (inclusive from, exclusive to)'
    ),
  get_workout: z.object({ id, ...page }).strict(),
  get_workout_sets: z
    .object({ workout_id: id, workout_item_id: id, ...page })
    .strict(),
  get_exercise: z.object({ id }).strict(),
  exercise_metadata: z
    .object({ kind: z.enum(['categories', 'muscles']), ...page })
    .strict(),
  exercise_history: z.object({ exercise_id: id, ...page }).strict(),
  search_exercises: z
    .object({ query: z.string().trim().max(120).default(''), ...page })
    .strict(),
  list_plans: z
    .object({
      after: z.string().uuid().optional(),
      limit: page.limit,
      status: z.enum(['pending', 'started', 'all']).default('all'),
    })
    .strict(),
  get_plan: z.object({ id: key }).strict(),
  create_plan: z.object({ request_id: key, plan: planSchema }).strict(),
  update_plan: z
    .object({ request_id: key, id: key, revision: id, plan: planSchema })
    .strict(),
  create_exercise: z
    .object({ request_id: key, exercise: exerciseSchema })
    .strict(),
  update_exercise: z
    .object({ request_id: key, id, exercise: exerciseSchema })
    .strict(),
  get_context: z.object({}).strict(),
  start_plan: z.object({ id: key, revision: id }).strict(),
  save_context: z
    .object({ revision: z.number().int().min(0), context: contextSchema })
    .strict(),
  save_feedback: z
    .object({
      workout_id: id,
      revision: z.number().int().min(0),
      difficulty: z.number().int().min(1).max(10).nullable(),
      note: z.string().trim().max(2000),
    })
    .strict(),
  get_feedback: z.object({ workout_id: id }).strict(),
  list_connections: z
    .object({ after: key.optional(), limit: page.limit })
    .strict(),
  revoke_connection: z.object({ id: key }).strict(),
} as const;
export type Operation = keyof typeof inputs;
export const toolScopes: Partial<Record<Operation, Scope>> = {
  list_workouts: 'training.read',
  get_workout: 'training.read',
  get_workout_sets: 'training.read',
  get_exercise: 'training.read',
  exercise_metadata: 'training.read',
  exercise_history: 'training.read',
  search_exercises: 'training.read',
  list_plans: 'training.read',
  get_plan: 'training.read',
  get_context: 'training.read',
  create_plan: 'plans.write',
  update_plan: 'plans.write',
  create_exercise: 'exercises.write',
  update_exercise: 'exercises.write',
};
export function performance(set: {
  is_finished: boolean;
  weight: number | null;
  reps: number | null;
  target_weight?: number | null;
  target_reps?: number | null;
}) {
  const actual = set.is_finished
    ? { weight: set.weight, reps: set.reps }
    : null;
  return {
    target: {
      weight: set.target_weight ?? null,
      reps: set.target_reps ?? null,
    },
    actual,
    weight_delta:
      actual?.weight != null && set.target_weight != null
        ? actual.weight - set.target_weight
        : null,
    reps_delta:
      actual?.reps != null && set.target_reps != null
        ? actual.reps - set.target_reps
        : null,
  };
}
