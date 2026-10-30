'use client'

import { useEffect } from 'react'

/** This app has no service worker. Retire stale localhost workers from other apps. */
export function LocalServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1'].includes(location.hostname) || !('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      const removed = await Promise.all(registrations.map((registration) => registration.unregister()))
      if (!cancelled && removed.some(Boolean) && navigator.serviceWorker.controller) location.reload()
    }).catch(() => { console.warn('[dev] Could not retire a stale local service worker') })
    return () => { cancelled = true }
  }, [])
  return null
}
