/**
 * Standard contract for external integrations (K-5)
 * Disallows synthetic data, random numbers, and mock numbers.
 * Integrations return either active connected data or an honest disconnected state.
 */
export type Integration<T> =
  | {
      connected: true
      data: T
      fetchedAt: string
    }
  | {
      connected: false
      reason: string
      howToConnect: string
    }

export function connectedResult<T>(data: T, fetchedAt?: string): Integration<T> {
  return {
    connected: true,
    data,
    fetchedAt: fetchedAt || new Date().toISOString(),
  }
}

export function notConnected<T = unknown>(reason: string, howToConnect: string): Integration<T> {
  return {
    connected: false,
    reason,
    howToConnect,
  }
}
