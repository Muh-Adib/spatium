import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

import { requireUser } from '@/lib/auth/rbac'
import {
  detectMimeFromBytes,
  sanitizeSvg,
  generateSafeFilename,
  isPathInsideUploads,
} from '@/lib/media/upload-guard'

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam form data.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Ukuran file (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal 5 MB.`,
        },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Inspect magic bytes (never trust file.type or extension)
    const detected = detectMimeFromBytes(buffer)
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      return NextResponse.json(
        {
          error: `Format file tidak valid atau tidak didukung (terdeteksi: ${detected?.mime || 'unknown'}). Harap upload gambar berformat WebP, PNG, JPG, GIF, AVIF, atau SVG yang valid.`,
        },
        { status: 400 }
      )
    }

    let finalBuffer: Buffer = buffer

    // If SVG, strictly sanitize against XSS/XXE/scripts
    if (detected.mime === 'image/svg+xml') {
      const svgText = buffer.toString('utf-8')
      const sanitizeResult = sanitizeSvg(svgText)
      if (!sanitizeResult.valid || !sanitizeResult.sanitized) {
        return NextResponse.json(
          {
            error: `SVG ditolak karena tidak memenuhi kriteria keamanan: ${sanitizeResult.error || 'Konten tidak aman'}.`,
          },
          { status: 400 }
        )
      }
      finalBuffer = Buffer.from(sanitizeResult.sanitized, 'utf-8')
    }

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Server-side unguessable filename (UUID + verified extension)
    const uniqueFilename = generateSafeFilename(detected.ext)
    const targetFilePath = path.join(uploadsDir, uniqueFilename)

    if (!isPathInsideUploads(targetFilePath)) {
      return NextResponse.json(
        { error: 'Path traversal terdeteksi pada target upload.' },
        { status: 400 }
      )
    }

    await fs.promises.writeFile(targetFilePath, finalBuffer)

    const publicUrl = `/uploads/${uniqueFilename}`

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
        size: finalBuffer.length,
        mime: detected.mime,
        message: 'Gambar berhasil diunggah dan diverifikasi keamanannya.',
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error: any) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      {
        error: error.message || 'Gagal mengunggah file ke media storage server.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').toLowerCase().trim()
    const folder = searchParams.get('folder') || 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '36', 10)))

    const publicDir = path.join(process.cwd(), 'public')
    const scanDirs: { dir: string; type: string }[] = []

    if (folder === 'all' || folder === 'uploads') {
      scanDirs.push({ dir: path.join(publicDir, 'uploads'), type: 'Uploads' })
    }
    if (folder === 'all' || folder === 'articles') {
      scanDirs.push({ dir: path.join(publicDir, 'images', 'articles'), type: 'Artikel' })
    }
    if (folder === 'all' || folder === 'brand') {
      scanDirs.push({ dir: path.join(publicDir, 'images'), type: 'Brand' })
    }

    interface MediaItem {
      url: string
      name: string
      size: number
      type: string
      modifiedAt: string
    }

    const items: MediaItem[] = []
    const seenUrls = new Set<string>()

    for (const entry of scanDirs) {
      if (!fs.existsSync(entry.dir)) continue

      const scanRecursive = (dirPath: string) => {
        try {
          const dirents = fs.readdirSync(dirPath, { withFileTypes: true })
          for (const d of dirents) {
            const fullPath = path.join(dirPath, d.name)
            if (d.isDirectory()) {
              scanRecursive(fullPath)
            } else if (/\.(jpe?g|png|webp|avif|svg|gif)$/i.test(d.name)) {
              const relPath = fullPath.replace(publicDir, '').replace(/\\/g, '/')
              if (!seenUrls.has(relPath)) {
                seenUrls.add(relPath)
                let stat
                try {
                  stat = fs.statSync(fullPath)
                } catch {
                  stat = { size: 0, mtime: new Date() }
                }
                items.push({
                  url: relPath,
                  name: d.name,
                  size: stat.size,
                  type: entry.type,
                  modifiedAt: stat.mtime.toISOString(),
                })
              }
            }
          }
        } catch {}
      }

      scanRecursive(entry.dir)
    }

    // Sort by modified date descending (newest first)
    items.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

    // Search filter
    const filtered = search
      ? items.filter((it) => it.name.toLowerCase().includes(search) || it.url.toLowerCase().includes(search))
      : items

    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginated = filtered.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      items: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching media library:', error)
    return NextResponse.json({ error: error.message || 'Gagal memuat pustaka media.' }, { status: 500 })
  }
}

