import fs from 'fs'
import { createHash } from 'crypto'
import path from 'path'
import sharp from 'sharp'
import { slugify } from '@/lib/content/html'
import { safeFetch } from '@/lib/security/ssrf'

import { db as prisma } from '../../../prisma/db'

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads')

export interface RegisterMediaItemInput {
  fileName: string
  url: string
  altText?: string | null
  title?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
  size?: number | null
  usedIn?: string | null
  uploadedBy?: string | null
}

/**
 * Registers or updates a downloaded media item in the media_items table
 */
export async function registerMediaItem(data: RegisterMediaItemInput) {
  try {
    const existing = await prisma.orm.public.MediaItem.where({ url: data.url }).first()

    const rawAlt = data.altText || data.title || ''
    const altTextVal = rawAlt.startsWith('{')
      ? rawAlt
      : JSON.stringify({ id: rawAlt, en: rawAlt })

    const usedInVal = data.usedIn
      ? (data.usedIn.startsWith('[') ? data.usedIn : JSON.stringify([data.usedIn]))
      : JSON.stringify(['articles'])

    if (existing) {
      const updateData: any = {}
      if (!existing.width && data.width) updateData.width = data.width
      if (!existing.height && data.height) updateData.height = data.height
      if (!existing.size && data.size) updateData.size = data.size
      if (!existing.title && data.title) updateData.title = data.title
      if ((!existing.altText || existing.altText === '{"id":"","en":""}') && altTextVal !== '{"id":"","en":""}') {
        updateData.altText = altTextVal
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.orm.public.MediaItem.where({ id: existing.id }).update(updateData)
      }
      return existing
    }

    const created = await prisma.orm.public.MediaItem.create({
      fileName: data.fileName,
      url: data.url,
      altText: altTextVal,
      title: data.title || data.fileName,
      mimeType: data.mimeType || 'image/webp',
      width: data.width || 1200,
      height: data.height || 630,
      size: data.size || 0,
      usedIn: usedInVal,
      uploadedBy: data.uploadedBy || 'wp-sync',
    })
    return created
  } catch (err: any) {
    console.warn(`[Media Optimizer] Failed to register media item for ${data.url}:`, err?.message || err)
    return null
  }
}

/**
 * Ensure upload directories exist
 */
export function ensureUploadDir(subfolder: string = 'articles'): string {
  const dir = path.join(UPLOAD_ROOT, subfolder)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Completely purges all uploaded/downloaded media files from /public/uploads/articles and /public/uploads/pages
 */
export function cleanUploadedMedia(): { deletedFiles: number } {
  let count = 0
  const subfolders = ['articles', 'pages']

  for (const sub of subfolders) {
    const dir = path.join(UPLOAD_ROOT, sub)
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        try {
          const filePath = `${dir}/${file}`
          const stat = fs.statSync(filePath)
          if (stat.isFile()) {
            fs.unlinkSync(filePath)
            count++
          }
        } catch (e) {
          console.warn(`Failed to delete media file ${file}:`, e)
        }
      }
    }
  }

  return { deletedFiles: count }
}

/**
 * Downloads a remote image, compresses it to modern WebP format,
 * resizes if dimension exceeds max dimensions, and saves it locally in /public/uploads/.
 * Automatically registers the image in media_items table.
 *
 * Returns the local web URL (e.g. /uploads/articles/cover-seo-segia-4.webp).
 */
export async function downloadAndOptimizeImage(
  remoteUrl: string | null | undefined,
  subfolder: string = 'articles',
  metadata?: { altText?: string; title?: string }
): Promise<string | null> {
  if (!remoteUrl || typeof remoteUrl !== 'string') return null

  // If already a local URL, ensure it is registered in media_items if physically on disk
  if (remoteUrl.startsWith('/uploads/') || remoteUrl.startsWith('/images/')) {
    const localPhysicalPath = path.join(process.cwd(), 'public', remoteUrl.replace(/^\//, ''))
    if (fs.existsSync(localPhysicalPath)) {
      const stat = fs.statSync(localPhysicalPath)
      if (stat.isFile() && stat.size > 0) {
        let width = 1200
        let height = 630
        try {
          if (!remoteUrl.endsWith('.svg')) {
            const meta = await sharp(localPhysicalPath).metadata()
            width = meta.width || 1200
            height = meta.height || 630
          }
        } catch (err) { console.warn("[observable error]:", err) }
        await registerMediaItem({
          fileName: path.basename(localPhysicalPath),
          url: remoteUrl,
          altText: metadata?.altText || metadata?.title,
          title: metadata?.title || path.basename(localPhysicalPath),
          mimeType: remoteUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/webp',
          width,
          height,
          size: stat.size,
          usedIn: subfolder,
          uploadedBy: 'wp-sync',
        })
      }
    }
    return remoteUrl
  }

  // Must be a valid HTTP/HTTPS URL
  if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
    return remoteUrl
  }

  let mediaLabel = '[media URL]'
  try {
    const url = new URL(remoteUrl)
    mediaLabel = url.origin + url.pathname
  } catch (err) { console.warn("[observable error]:", err) }

  try {
    const dir = ensureUploadDir(subfolder)

    // Generate clean filename
    const urlObj = new URL(remoteUrl)
    const baseName = path.basename(urlObj.pathname)
    const ext = path.extname(baseName)
    const nameWithoutExt = baseName.replace(ext, '')
    const cleanName = `${slugify(nameWithoutExt) || 'image'}-${createHash('sha256').update(remoteUrl).digest('hex').slice(0, 16)}`
    const outputFilename = `${cleanName}.webp`
    const targetFilePath = path.join(dir, outputFilename)
    const relativeUrl = `/uploads/${subfolder}/${outputFilename}`

    // Check if already downloaded and compressed (Idempotent)
    if (fs.existsSync(targetFilePath)) {
      const stat = fs.statSync(targetFilePath)
      if (stat.size > 0) {
        let width = 1200
        let height = 630
        try {
          const meta = await sharp(targetFilePath).metadata()
          width = meta.width || 1200
          height = meta.height || 630
        } catch (err) { console.warn("[observable error]:", err) }

        await registerMediaItem({
          fileName: outputFilename,
          url: relativeUrl,
          altText: metadata?.altText || metadata?.title,
          title: metadata?.title || outputFilename,
          mimeType: 'image/webp',
          width,
          height,
          size: stat.size,
          usedIn: subfolder,
          uploadedBy: 'wp-sync',
        })

        return relativeUrl
      }
    }

    // Download image using SSRF-safe fetch
    const res = await safeFetch(remoteUrl, {
      timeoutMs: 15000,
      headers: {
        'User-Agent': 'WebShift-Media-Downloader/2.0',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!res.ok) {
      console.warn(`[Media Optimizer] HTTP ${res.status} when downloading: ${mediaLabel}`)
      return remoteUrl
    }

    const arrayBuffer = await res.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    const originalSize = inputBuffer.length

    // If SVG, strictly sanitize and verify path before saving
    if (ext.toLowerCase() === '.svg') {
      const { sanitizeSvg, isPathInsideUploads } = await import('@/lib/media/upload-guard')
      const sanitizeResult = sanitizeSvg(inputBuffer.toString('utf-8'))
      if (!sanitizeResult.valid || !sanitizeResult.sanitized) {
        console.warn(`[Media Optimizer] Skipping unsafe SVG from ${mediaLabel}: ${sanitizeResult.error}`)
        return null
      }
      const svgPath = path.join(dir, `${cleanName}.svg`)
      if (!isPathInsideUploads(svgPath)) {
        console.warn(`[Media Optimizer] Path traversal detected for: ${svgPath}`)
        return null
      }
      fs.writeFileSync(svgPath, Buffer.from(sanitizeResult.sanitized, 'utf-8'))
      const svgUrl = `/uploads/${subfolder}/${cleanName}.svg`

      await registerMediaItem({
        fileName: `${cleanName}.svg`,
        url: svgUrl,
        altText: metadata?.altText || metadata?.title,
        title: metadata?.title || `${cleanName}.svg`,
        mimeType: 'image/svg+xml',
        width: 800,
        height: 600,
        size: fs.statSync(svgPath).size,
        usedIn: subfolder,
        uploadedBy: 'wp-sync',
      })

      return svgUrl
    }

    // Process with sharp (Compress to WebP, resize if > 1440px wide, auto-orient EXIF)
    const sharpInstance = sharp(inputBuffer)
      .rotate() // auto-orient
      .resize({
        width: 1440,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({
        quality: 82,
        effort: 4,
      })

    const sharpInfo = await sharpInstance.toFile(targetFilePath)
    const newSize = sharpInfo.size || fs.statSync(targetFilePath).size
    const savedPct = Math.round((1 - newSize / (originalSize || 1)) * 100)
    console.log(
      `[Media Optimizer] Saved & compressed ${outputFilename}: ${(originalSize / 1024).toFixed(
        1
      )}KB -> ${(newSize / 1024).toFixed(1)}KB (${savedPct}% saved)`
    )

    await registerMediaItem({
      fileName: outputFilename,
      url: relativeUrl,
      altText: metadata?.altText || metadata?.title,
      title: metadata?.title || outputFilename,
      mimeType: 'image/webp',
      width: sharpInfo.width || 1200,
      height: sharpInfo.height || 630,
      size: newSize,
      usedIn: subfolder,
      uploadedBy: 'wp-sync',
    })

    return relativeUrl
  } catch (err: any) {
    console.warn(`[Media Optimizer] Failed to process ${mediaLabel}:`, err.name || 'MediaError')
    return remoteUrl
  }
}

/**
 * Scans article HTML content for images, downloads and compresses any
 * remote images locally, registers them in media_items, and updates <img> src to local path.
 */
export async function localizeAndOptimizeContentImages(
  htmlContent: string,
  subfolder: string = 'articles',
  articleTitle?: string
): Promise<string> {
  if (!htmlContent) return ''

  // Regex to find image sources
  const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi
  const matches = [...htmlContent.matchAll(imgRegex)]

  if (matches.length === 0) return htmlContent

  let updatedHtml = htmlContent

  for (const match of matches) {
    const fullImgTag = match[0]
    const remoteSrc = match[1]

    // Process images from wordpress uploads or relevant domains
    if (
      remoteSrc.includes('segiatech.com') ||
      remoteSrc.includes('unimasi.com') ||
      remoteSrc.includes('wp-content/uploads')
    ) {
      try {
        const altMatch = fullImgTag.match(/alt=["']([^"']*)["']/i)
        const extractedAlt = altMatch ? altMatch[1] : undefined

        const localSrc = await downloadAndOptimizeImage(remoteSrc, subfolder, {
          altText: extractedAlt || articleTitle,
          title: articleTitle,
        })
        if (localSrc && localSrc !== remoteSrc) {
          const newImgTag = fullImgTag.replace(remoteSrc, localSrc)
          updatedHtml = updatedHtml.replace(fullImgTag, newImgTag)
        }
      } catch (e) {
        console.warn(`[Media Optimizer] Skipping content image ${remoteSrc}:`, e)
      }
    }
  }

  return updatedHtml
}
