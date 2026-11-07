/**
 * Safe error responses for API route handlers (AGENTS.md §3.6).
 *
 * Responses never carry raw error messages or stack traces. Messages meant for
 * the editor (validation, conflicts) are thrown as `PublicError` and passed
 * through; everything else is logged on the server and replaced by a fallback.
 */
import { NextResponse } from 'next/server'

/** An error whose message is written for Studio users and safe to return. */
export class PublicError extends Error {
  readonly status: number
  /** Machine-readable code for clients (e.g. `conflict`, `slug_taken`). */
  readonly code?: string
  /** Extra JSON-safe fields merged into the response body (e.g. `currentUpdatedAt`). */
  readonly details?: Record<string, string | number | boolean | null>

  constructor(
    message: string,
    status = 400,
    options: { code?: string; details?: Record<string, string | number | boolean | null> } = {},
  ) {
    super(message)
    this.name = 'PublicError'
    this.status = status
    this.code = options.code
    this.details = options.details
  }
}

/** Message safe to show the client: a `PublicError` message, otherwise the fallback. */
export function publicMessage(error: unknown, fallback: string): string {
  return error instanceof PublicError ? error.message : fallback
}

/**
 * Logs `error` under `context` and returns a JSON error response. A
 * `PublicError` keeps its own message and status; anything else becomes
 * `fallback` with `status` (default 500).
 */
export function errorResponse(
  context: string,
  error: unknown,
  fallback: string,
  status = 500,
): NextResponse {
  if (error instanceof PublicError) {
    return NextResponse.json(
      { ...error.details, success: false, error: error.message, ...(error.code ? { code: error.code } : {}) },
      { status: error.status },
    )
  }
  console.error(`[${context}]`, error)
  return NextResponse.json({ success: false, error: fallback }, { status })
}
