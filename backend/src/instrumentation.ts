export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build' && process.env.PUBLICATION_SCHEDULER_ENABLED !== 'false') {
    const { startPublicationScheduler } = await import('./lib/publishing/scheduler')
    startPublicationScheduler()
  }
}
