import { config, failure, json } from '@/lib/integrations/server';
export const dynamic = 'force-dynamic';
export function GET() {
  try {
    const { origin } = config();
    return json(
      {
        issuer: origin,
        authorization_endpoint: origin + '/api/oauth/authorize',
        token_endpoint: origin + '/api/oauth/token',
        registration_endpoint: origin + '/api/oauth/register',
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['none'],
        code_challenge_methods_supported: ['S256'],
        scopes_supported: ['training.read', 'plans.write', 'exercises.write'],
      },
      200,
      { 'Access-Control-Allow-Origin': '*' }
    );
  } catch (e) {
    return failure(e);
  }
}
