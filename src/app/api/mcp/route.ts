import { handleMcpPost, methodNotAllowed } from '@/lib/mcp/server'

/**
 * Model Context Protocol endpoint (Streamable HTTP, stateless).
 * Auth is per-client API key (`Authorization: Bearer spm_…`, managed in
 * Studio → MCP) verified in `handleMcpPost`; the proxy lets this path through
 * to that route-level check. MCP clients can only create and edit drafts.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  // Auth: verifyMcpApiKey (Bearer API key) runs inside handleMcpPost before any work.
  return handleMcpPost(request)
}

/** No server-initiated SSE stream is offered. */
export function GET(): Response {
  return methodNotAllowed()
}

/** Stateless server: there is no session to terminate. */
export function DELETE(): Response {
  return methodNotAllowed()
}
