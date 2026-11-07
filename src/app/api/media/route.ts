import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import {
  getMediaItems,
  getMediaItem,
  updateMediaItem,
  renameMediaItem,
  generateMediaAudit,
  registerMediaItem,
  deleteMediaItem,
} from '@/lib/db/media'
import { requireUser } from '@/lib/auth/rbac'
import { requireCan } from '@/lib/auth/capabilities'
import { PublicError } from '@/lib/http/errors'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { checkRateLimit, clientKey, rateLimitResponse } from '@/lib/security/rate-limit'
import {
  detectMimeFromBytes,
  sanitizeSvg,
  generateSafeFilename,
  isPathInsideUploads,
} from '@/lib/media/upload-guard'
import {
  MAX_UPLOAD_BYTES,
  mediaActionBodySchema,
  mediaPatchBodySchema,
  oversizeMessage,
  zodIssueMessages,
} from '@/lib/media/media-schema'

/** Error body in the shape the media manager reads (`errors: string[]`). */
function fail(context: string, err: unknown, fallback: string): NextResponse {
  if (err instanceof PublicError) {
    return NextResponse.json({ data: null, errors: [err.message] }, { status: err.status })
  }
  console.error(`[api/media] ${context} failed:`, err)
  return NextResponse.json({ data: null, errors: [fallback] }, { status: 500 })
}

function invalid(messages: string[], status = 422): NextResponse {
  return NextResponse.json({ data: null, errors: messages }, { status })
}

const actorOf = (user: { email?: string; name: string }) => user.email ?? user.name

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // 1. Media Audit Report (Section 5.5)
    if (action === 'audit') {
      const report = await generateMediaAudit()
      return NextResponse.json({
        data: report,
        errors: [],
        warnings: [],
      })
    }

    // 2. Single Media Item
    const id = searchParams.get('id')
    if (id) {
      const numericId = Number(id)
      if (!Number.isInteger(numericId) || numericId <= 0) return invalid(['ID media tidak valid.'], 400)
      const item = await getMediaItem(numericId)
      if (!item) {
        return NextResponse.json({ data: null, errors: ['Media tidak ditemukan.'] }, { status: 404 })
      }
      return NextResponse.json({ data: item, errors: [], warnings: [] })
    }

    // 3. Paginated Media List with Filters
    const search = (searchParams.get('search') || '').slice(0, 200)
    const rawFilter = searchParams.get('filter') || 'all'
    const filter = (['all', 'missing_alt', 'unused', 'oversized'] as const).find((f) => f === rawFilter) ?? 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '36', 10) || 36))

    const result = await getMediaItems({ search, filter, page, pageSize })
    return NextResponse.json({
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
      errors: [],
      warnings: [],
    })
  } catch (err) {
    return fail('list', err, 'Gagal memuat media.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'media:manage')
  if (auth.error) return auth.error
  const actor = actorOf(auth.user)

  try {
    const contentType = request.headers.get('content-type') || ''

    // 1. JSON Actions (Rename, Bulk Edit)
    if (contentType.includes('application/json')) {
      let body: unknown
      try {
        body = await request.json()
      } catch (err) {
        console.warn('[api/media] invalid JSON body:', err)
        return invalid(['Body permintaan harus JSON yang valid.'], 400)
      }
      const parsed = mediaActionBodySchema.safeParse(body)
      if (!parsed.success) return invalid(zodIssueMessages(parsed.error))

      if (parsed.data.action === 'rename') {
        const { item, touched } = await renameMediaItem(parsed.data.id, parsed.data.newFileName, actor)
        // References were rewritten: refresh the public pages that show them.
        for (const slug of touched.articles) await revalidateCatalog('article', slug)
        for (const slug of touched.portfolios) await revalidateCatalog('portfolio', slug)
        for (const slug of touched.services) await revalidateCatalog('service', slug)
        return NextResponse.json({
          data: item,
          message: `Berhasil mengubah nama file menjadi "${item.fileName}" dan mendaftarkan 301 redirect.`,
          errors: [],
          warnings: [],
        })
      }

      const { items } = parsed.data
      for (const { id, ...patch } of items) {
        await updateMediaItem(id, patch, actor)
      }
      return NextResponse.json({
        data: { updatedCount: items.length },
        message: `Berhasil memperbarui metadata ${items.length} media.`,
        errors: [],
        warnings: [],
      })
    }

    // 2. Multipart Form Upload
    const rl = checkRateLimit({ key: clientKey(request, 'media-upload'), limit: 30, windowMs: 60_000 })
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const formData = await request.formData()
    const file = formData.get('file')
    const field = (name: string, max: number) => {
      const v = formData.get(name)
      return typeof v === 'string' ? v.trim().slice(0, max) : ''
    }
    const altId = field('alt_id', 300)
    const altEn = field('alt_en', 300)
    const title = field('title', 200)
    const caption = field('caption', 500)

    if (!(file instanceof File)) {
      return invalid(['File tidak ditemukan dalam form data.'], 400)
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return invalid([oversizeMessage(file.size)], 413)
    }

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Inspect magic bytes
    const detected = detectMimeFromBytes(buffer)
    if (!detected) {
      return invalid(['Format file tidak valid atau tidak dikenali. Unggah gambar WebP, PNG, JPG, GIF, AVIF, atau SVG.'], 400)
    }

    const isSvg = detected.mime === 'image/svg+xml'
    let finalBuffer: Buffer = buffer
    let width: number | null = null
    let height: number | null = null

    if (isSvg) {
      const sanitizeResult = sanitizeSvg(buffer.toString('utf-8'))
      if (!sanitizeResult.valid || !sanitizeResult.sanitized) {
        return invalid([`SVG ditolak: ${sanitizeResult.error || 'Konten tidak aman'}`], 400)
      }
      finalBuffer = Buffer.from(sanitizeResult.sanitized, 'utf-8')
    } else {
      // Optimize using sharp: auto-rotate, strip sensitive EXIF, convert to WebP
      let processed: { data: Buffer; info: { width: number; height: number } }
      try {
        processed = await sharp(buffer).rotate().webp({ quality: 85 }).toBuffer({ resolveWithObject: true })
      } catch (err) {
        console.warn('[api/media] image could not be decoded:', err)
        return invalid(['Gambar tidak dapat dibaca. File mungkin rusak.'], 400)
      }
      finalBuffer = processed.data
      width = processed.info.width
      height = processed.info.height
    }

    const cleanFileName = generateSafeFilename(isSvg ? 'svg' : 'webp')
    const targetFilePath = path.join(uploadsDir, cleanFileName)

    if (!isPathInsideUploads(targetFilePath)) {
      return invalid(['Path traversal terdeteksi.'], 400)
    }

    await fs.promises.writeFile(targetFilePath, finalBuffer)

    let item
    try {
      item = await registerMediaItem(
        {
          fileName: cleanFileName,
          url: `/uploads/${cleanFileName}`,
          size: finalBuffer.length,
          mimeType: isSvg ? 'image/svg+xml' : 'image/webp',
          width,
          height,
          altText: { id: altId, en: altEn },
          title,
          caption,
        },
        auth.user.id,
        actor,
      )
    } catch (err) {
      // No row means no library entry: do not leave an orphan file behind.
      await fs.promises.unlink(targetFilePath).catch((unlinkErr) => console.warn('[api/media] orphan cleanup failed:', unlinkErr))
      throw err
    }

    return NextResponse.json({
      data: item,
      message: isSvg ? 'SVG berhasil diunggah dan dibersihkan.' : 'File berhasil diunggah, dikonversi ke WebP, dan dioptimasi.',
      errors: [],
      warnings: [],
    })
  } catch (err) {
    return fail('post', err, 'Gagal memproses media.')
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCan(request, 'media:manage')
  if (auth.error) return auth.error

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch (err) {
      console.warn('[api/media] invalid JSON body:', err)
      return invalid(['Body permintaan harus JSON yang valid.'], 400)
    }
    const parsed = mediaPatchBodySchema.safeParse(body)
    if (!parsed.success) return invalid(zodIssueMessages(parsed.error))

    const { id, ...patch } = parsed.data
    const updated = await updateMediaItem(id, patch, actorOf(auth.user))

    return NextResponse.json({
      data: updated,
      message: 'Metadata media berhasil diperbarui.',
      errors: [],
      warnings: [],
    })
  } catch (err) {
    return fail('patch', err, 'Gagal memperbarui media.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'media:delete')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id') || '0')

    if (!Number.isInteger(id) || id <= 0) {
      return invalid(['ID media wajib diisi.'], 400)
    }

    const item = await getMediaItem(id)
    if (!item) {
      return NextResponse.json({ data: null, errors: ['Media tidak ditemukan.'] }, { status: 404 })
    }

    // Strict path containment check before touching the disk
    const safeUploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    const filePath = path.resolve(process.cwd(), 'public', item.url.replace(/^\//, ''))
    if (!filePath.startsWith(safeUploadsDir + path.sep)) {
      return invalid(['Operasi dilarang: file berada di luar direktori uploads.'], 400)
    }

    await deleteMediaItem(id, actorOf(auth.user))

    // Row is gone; a leftover file would be re-imported by the library sync, so report it.
    let warnings: string[] = []
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath)
      } catch (err) {
        console.warn('[api/media] file delete failed:', filePath, err)
        warnings = ['Data media dihapus, tetapi file fisik gagal dihapus dari server.']
      }
    }

    return NextResponse.json({
      data: { success: true, id },
      message: 'Media berhasil dihapus.',
      errors: [],
      warnings,
    })
  } catch (err) {
    return fail('delete', err, 'Gagal menghapus media.')
  }
}
