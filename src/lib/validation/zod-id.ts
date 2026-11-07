import { z } from 'zod'

/**
 * Zod's built-in messages in Indonesian, for user-facing validation (Studio
 * saves, block checks). Pass as `schema.safeParse(value, { error: ZOD_ID_ERRORS })`;
 * messages written in a schema still win. Client-safe.
 */
export const ZOD_ID_ERRORS = z.locales.id().localeError
