import { z } from 'zod';

import { inputs, Operation, toolScopes } from '@/lib/integrations/contracts';

// Convert the deliberately small schema vocabulary used by our tools. Runtime parsing
// always uses the original Zod schema; unsupported additions fail during tools/list.
export function jsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault)
    return jsonSchema(schema._def.innerType);
  if (schema instanceof z.ZodNullable)
    return { anyOf: [jsonSchema(schema._def.innerType), { type: 'null' }] };
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(shape).map(([k, v]) => [k, jsonSchema(v)])
      ),
      required: Object.entries(shape)
        .filter(([, v]) => !v.isOptional())
        .map(([k]) => k),
      additionalProperties: false,
    };
  }
  if (schema instanceof z.ZodArray)
    return {
      type: 'array',
      items: jsonSchema(schema.element),
      ...(schema._def.minLength
        ? { minItems: schema._def.minLength.value }
        : {}),
      ...(schema._def.maxLength
        ? { maxItems: schema._def.maxLength.value }
        : {}),
    };
  if (schema instanceof z.ZodEnum)
    return { type: 'string', enum: schema.options };
  if (schema instanceof z.ZodString)
    return {
      type: 'string',
      ...(schema.minLength !== null ? { minLength: schema.minLength } : {}),
      ...(schema.maxLength !== null ? { maxLength: schema.maxLength } : {}),
    };
  if (schema instanceof z.ZodNumber)
    return {
      type: schema.isInt ? 'integer' : 'number',
      ...(schema.minValue !== null ? { minimum: schema.minValue } : {}),
      ...(schema.maxValue !== null ? { maximum: schema.maxValue } : {}),
    };
  throw new Error('Unsupported tool schema');
}
const descriptions: Partial<Record<Operation, string>> = {
  get_workout_sets:
    'Eigene Sätze eines Workout-Items mit getrennten Ziel- und Istwerten. after = letzte Satz-ID; maximal 50 je Seite.',
  get_exercise:
    'Öffentliche oder eigene Übung anhand der exakten Versions-ID lesen, inklusive Kategorien und Muskel-IDs.',
  exercise_metadata:
    'Gültige Kategorien oder Muskeln für die Übungsanlage; after = letzte ID.',
  list_workouts:
    'Eigene aktive und abgeschlossene Workouts; nur bestätigte Sätze zählen als Leistung. Pagination: after = letzte ID.',
  get_workout:
    'Eigenes Workout mit ursprünglichem Plan und Feedback. Items nach ID paginiert: after = letzte Item-ID. Je Item erste 50 Sätze, weitere über get_workout_sets. actual=null bedeutet nicht bestätigt.',
  exercise_history:
    'Eigene Trainings mit dieser exakten Übungsversion und bestätigte Kennzahlen. Details über get_workout. Pagination: after = letzte ID.',
  search_exercises:
    'Öffentliche und eigene Übungen suchen. Aktuelle Versionen; keine fremden privaten Übungen. Pagination: after = letzte ID.',
  list_plans:
    'Eigene Trainingspläne mit Revision und Startstatus. Pagination: after = letzte ID.',
  get_plan: 'Eigener Trainingsplan einschließlich Vorgaben und Begründung.',
  create_plan:
    'Zukünftigen Trainingsplan vollständig anlegen. Gewicht/Reps für weight/other Übungen. Termin optional; rationale begründet Vorgaben. request_id als UUID bei Wiederholung beibehalten.',
  update_plan:
    'Noch nicht gestarteten eigenen Plan ersetzen; erwartete revision angeben. Bei Konflikt neu lesen, keine stillen Überschreibungen. request_id bei Wiederholung beibehalten.',
  create_exercise:
    'Private eigene Übung anlegen. request_id bei Wiederholung beibehalten.',
  update_exercise:
    'Neue private Version einer eigenen privaten Übung erzeugen. Gibt neue ID zurück; alte Workouts und Pläne behalten ihre Übungsversion. request_id bei Wiederholung beibehalten.',
  get_context:
    'Freiwillige Trainingsbedingungen: verfügbare Zeit, Geräte, zu vermeidende Übungen und eigene Notizen. Keine medizinische Interpretation.',
};
export function toolsFor(scopes: string[]) {
  return Object.entries(toolScopes)
    .filter(([, s]) => scopes.includes(s))
    .map(([name]) => ({
      name,
      description: descriptions[name as Operation],
      inputSchema: jsonSchema(inputs[name as Operation]),
      annotations: {
        readOnlyHint: toolScopes[name as Operation] === 'training.read',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    }));
}
export const rpcSchema = z
  .object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string().max(200), z.number().finite()]).optional(),
    method: z.string().max(100),
    params: z.record(z.unknown()).optional(),
  })
  .strict();
