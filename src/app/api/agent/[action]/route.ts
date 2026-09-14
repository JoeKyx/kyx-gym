import { inputs, Operation } from '@/lib/integrations/contracts';
import {
  execute,
  failure,
  json,
  readBody,
  sameOrigin,
  sessionUser,
} from '@/lib/integrations/server';

export const dynamic = 'force-dynamic';
export async function POST(
  request: Request,
  props: { params: Promise<{ action: string }> }
) {
  const params = await props.params;
  try {
    sameOrigin(request);
    if (!Object.prototype.hasOwnProperty.call(inputs, params.action))
      return json({ error: 'Unbekannte Aktion.' }, 404);
    const owner_id = await sessionUser();
    return json(
      await execute(
        params.action as Operation,
        JSON.parse(await readBody(request)),
        { owner_id }
      )
    );
  } catch (e) {
    return failure(e);
  }
}
