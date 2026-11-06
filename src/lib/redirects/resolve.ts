import 'server-only'
import { permanentRedirect, redirect } from 'next/navigation'
import { getRedirect } from '@/lib/db/redirects'

/**
 * Applies a Studio-managed redirect (DB `redirects` table) before a page 404s.
 * Called only on the not-found path, so normal page renders pay no DB cost.
 * Must be called outside try/catch: redirect()/permanentRedirect() throw by design.
 */
export async function redirectIfMoved(pathname: string): Promise<void> {
  const match = await getRedirect(pathname)
  if (!match) return
  if (match.statusCode === 302 || match.statusCode === 307) redirect(match.destinationPath)
  permanentRedirect(match.destinationPath)
}
