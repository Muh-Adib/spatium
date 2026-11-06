/**
 * Runs once per Next.js server instance (Next 16 `instrumentation.ts`).
 *
 * Starts the publication scheduler so articles scheduled in the editor are
 * published when their time comes. Without this, `scheduledAt` was stored but
 * nothing ever acted on it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.DATABASE_URL) {
    console.warn('[instrumentation] DATABASE_URL not set — publication scheduler not started.')
    return
  }
  const { startPublicationScheduler } = await import('@/lib/publishing/scheduler')
  startPublicationScheduler()
}
