import 'server-only'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { PageError } from './repository'
import { pageErrorPayload, pageIdSchema } from './http'

/** Maps any thrown value to a JSON error response (no stack traces). */
export function pageErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof PageError) {
    const { status, body } = pageErrorPayload(err)
    return NextResponse.json(body, { status })
  }
  console.error(`[api/pages] ${context} failed:`, err)
  return NextResponse.json({ error: 'Terjadi kesalahan server. Coba lagi sebentar lagi.' }, { status: 500 })
}

export async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await request.json() }
  } catch (err) {
    console.warn('[api/pages] invalid JSON body:', err)
    return { ok: false, response: NextResponse.json({ error: 'Body permintaan harus JSON yang valid.' }, { status: 400 }) }
  }
}

export function parsePageId(raw: string): { ok: true; id: number } | { ok: false; response: NextResponse } {
  const parsed = pageIdSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: 'ID halaman tidak valid.' }, { status: 400 }) }
  }
  return { ok: true, id: parsed.data }
}

/** Revalidation must never fail the mutation that already committed. */
export function revalidatePublicPaths(paths: string[]): void {
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch (err) {
      console.warn(`[api/pages] revalidatePath(${path}) failed:`, err)
    }
  }
}
