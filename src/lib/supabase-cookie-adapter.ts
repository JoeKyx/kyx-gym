import { cookies } from 'next/headers';

// The existing auth helpers consume a synchronous cookie store at runtime but
// derive their type from Next's now-async cookies(). Resolve it in the caller
// and adapt this legacy type boundary without changing existing session format.
export function syncCookies(
  store: Awaited<ReturnType<typeof cookies>>
): typeof cookies {
  return (() => store) as unknown as typeof cookies;
}
