/**
 * Utility functions for Clerk authentication and Supabase PostgreSQL integration.
 */

/**
 * Validates whether a string conforms to standard RFC4122 UUID syntax.
 */
export function isValidUuid(str: unknown): str is string {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
