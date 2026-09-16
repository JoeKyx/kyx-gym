import { config, failure, json } from '@/lib/integrations/server';
export const dynamic = 'force-dynamic';
export function GET() {
  try {
    const { origin, resource } = config();
    return json(
      {
        resource,
        authorization_servers: [origin],
        bearer_methods_supported: ['header'],
        scopes_supported: ['training.read', 'plans.write', 'exercises.write'],
      },
      200,
      { 'Access-Control-Allow-Origin': '*' }
    );
  } catch (e) {
    return failure(e);
  }
}
