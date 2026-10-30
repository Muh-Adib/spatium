import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get('x-revalidate-secret') ||
    req.nextUrl.searchParams.get('secret')

  const expectedSecret =
    process.env.CORE_REVALIDATE_SECRET ||
    process.env.REVALIDATE_SECRET ||
    'unimasi_secret_revalidate'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized secret' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { slug, tag, path } = body

    const safeTag = (t: string) => {
      try {
        (revalidateTag as any)(t, { expire: 0 })
      } catch {
        try {
          (revalidateTag as any)(t)
        } catch {}
      }
    }

    if (tag) {
      safeTag(tag)
    } else {
      safeTag('core-content')
      safeTag('core-articles')
    }

    if (path) {
      revalidatePath(path)
    } else if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath('/journal')
    } else {
      revalidatePath('/journal')
      revalidatePath('/')
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      target: slug ? `/${slug}` : path || tag || 'all',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error during revalidation', details: error.message },
      { status: 500 }
    )
  }
}
