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
  slugifyFileName,
} from '@/lib/db/media'
import { prisma } from '@/lib/db/prisma'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import {
  detectMimeFromBytes,
  sanitizeSvg,
  generateSafeFilename,
  isPathInsideUploads,
} from '@/lib/media/upload-guard'

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
      const item = await getMediaItem(parseInt(id, 10))
      if (!item) {
        return NextResponse.json({ data: null, errors: ['Media tidak ditemukan.'] }, { status: 404 })
      }
      return NextResponse.json({ data: item, errors: [], warnings: [] })
    }

    // 3. Paginated Media List with Filters
    const search = searchParams.get('search') || ''
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'missing_alt' | 'unused' | 'oversized'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '36', 10)

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
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memuat media.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const contentType = request.headers.get('content-type') || ''

    // 1. JSON Actions (Rename, Bulk Edit)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { action, id, newFileName, items } = body

      if (action === 'rename') {
        if (!id || !newFileName) {
          return NextResponse.json(
            { data: null, errors: ['ID dan newFileName wajib disertakan.'] },
            { status: 400 }
          )
        }
        const cleanNewName = path.basename(newFileName)
        if (!cleanNewName || cleanNewName.includes('..') || cleanNewName !== newFileName.trim()) {
          return NextResponse.json(
            { data: null, errors: ['Nama file tidak valid atau mengandung path traversal.'] },
            { status: 400 }
          )
        }
        const updated = await renameMediaItem(id, cleanNewName)
        return NextResponse.json({
          data: updated,
          message: `Berhasil mengubah nama file menjadi "${updated?.fileName}" dan mendaftarkan 301 redirect.`,
          errors: [],
          warnings: [],
        })
      }

      if (action === 'bulk_update') {
        if (!Array.isArray(items)) {
          return NextResponse.json(
            { data: null, errors: ['Items array wajib disertakan untuk bulk_update.'] },
            { status: 400 }
          )
        }
        for (const it of items) {
          if (it.id) {
            await updateMediaItem(it.id, it)
          }
        }
        return NextResponse.json({
          data: { updatedCount: items.length },
          message: `Berhasil memperbarui metadata ${items.length} media.`,
          errors: [],
          warnings: [],
        })
      }
    }

    // 2. Multipart Form Upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const altId = (formData.get('alt_id') as string) || ''
    const altEn = (formData.get('alt_en') as string) || ''
    const title = (formData.get('title') as string) || ''
    const caption = (formData.get('caption') as string) || ''

    if (!file) {
      return NextResponse.json({ data: null, errors: ['File tidak ditemukan dalam form data.'] }, { status: 400 })
    }

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Inspect magic bytes
    const detected = detectMimeFromBytes(buffer)
    if (!detected) {
      return NextResponse.json(
        { data: null, errors: ['Format file tidak valid atau tidak dikenali dari magic bytes.'] },
        { status: 400 }
      )
    }

    const isSvg = detected.mime === 'image/svg+xml'
    let finalBuffer: Buffer = buffer
    let width = 800
    let height = 600

    if (isSvg) {
      const svgText = buffer.toString('utf-8')
      const sanitizeResult = sanitizeSvg(svgText)
      if (!sanitizeResult.valid || !sanitizeResult.sanitized) {
        return NextResponse.json(
          { data: null, errors: [`SVG ditolak: ${sanitizeResult.error || 'Konten tidak aman'}`] },
          { status: 400 }
        )
      }
      finalBuffer = Buffer.from(sanitizeResult.sanitized, 'utf-8')
    } else {
      // Optimize using sharp: auto-rotate, strip sensitive EXIF, convert to WebP
      const processed = await sharp(buffer)
        .rotate()
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true })

      finalBuffer = processed.data
      width = processed.info.width
      height = processed.info.height
    }

    const cleanFileName = generateSafeFilename(isSvg ? 'svg' : 'webp')
    const targetFilePath = path.join(uploadsDir, cleanFileName)

    if (!isPathInsideUploads(targetFilePath)) {
      return NextResponse.json({ data: null, errors: ['Path traversal terdeteksi.'] }, { status: 400 })
    }

    await fs.promises.writeFile(targetFilePath, finalBuffer)
    const publicUrl = `/uploads/${cleanFileName}`

    // Insert into database via Prisma 8
    const inserted = await prisma.orm.public.MediaItem.create({
        fileName: cleanFileName,
        url: publicUrl,
        size: finalBuffer.length,
        mimeType: isSvg ? 'image/svg+xml' : 'image/webp',
        width,
        height,
        altText: JSON.stringify({ id: altId, en: altEn }),
        title: title || cleanFileName,
        caption,
        focalPoint: JSON.stringify({ x: 50, y: 50 }),
        usedIn: JSON.stringify([]),
        uploadedBy: 'admin_studio',
      })

    const item = await getMediaItem(inserted.id)

    return NextResponse.json({
      data: item,
      message: 'File berhasil diunggah, dikonversi ke WebP, dan dioptimasi.',
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memproses upload media.'] },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { id, altText, title, caption, description, decorative, focalPoint, credit } = body

    if (!id) {
      return NextResponse.json({ data: null, errors: ['ID media wajib diisi.'] }, { status: 400 })
    }

    const updated = await updateMediaItem(id, {
      altText,
      title,
      caption,
      description,
      decorative,
      focalPoint,
      credit,
    })

    return NextResponse.json({
      data: updated,
      message: 'Metadata media berhasil diperbarui.',
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memperbarui media.'] },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0', 10)

    if (!id) {
      return NextResponse.json({ data: null, errors: ['ID media wajib diisi.'] }, { status: 400 })
    }

    const item = await getMediaItem(id)
    if (!item) {
      return NextResponse.json({ data: null, errors: ['Media tidak ditemukan.'] }, { status: 404 })
    }

    // Delete physical file if exists with strict path containment check
    const safeUploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    const filePath = path.resolve(process.cwd(), 'public', item.url.replace(/^\//, ''))
    if (!filePath.startsWith(safeUploadsDir + path.sep)) {
      return NextResponse.json(
        { data: null, errors: ['Operasi dilarang: file berada di luar direktori uploads.'] },
        { status: 400 }
      )
    }

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
      } catch (err) { console.warn("[API observable error]:", err) }
    }

    await prisma.orm.public.MediaItem.where({ id }).delete()

    return NextResponse.json({
      data: { success: true, id },
      message: 'Media berhasil dihapus.',
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal menghapus media.'] },
      { status: 500 }
    )
  }
}
