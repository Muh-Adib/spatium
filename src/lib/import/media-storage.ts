import fs from 'fs'
import { createHash } from 'crypto'
import path from 'path'
import sharp from 'sharp'
import { slugify } from './transform'
import { safeFetch } from '@/lib/security/ssrf'

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads')

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
 * Downloads a remote image from WordPress, compresses it to modern WebP format,
 * resizes if dimension exceeds max dimensions, and saves it locally in /public/uploads/.
 *
 * Returns the local web URL (e.g. /uploads/articles/cover-seo-segia-4.webp).
 */
export async function downloadAndOptimizeImage(
  remoteUrl: string | null | undefined,
  subfolder: string = 'articles'
): Promise<string | null> {
  if (!remoteUrl || typeof remoteUrl !== 'string') return null

  // If already a local URL, return as is
  if (remoteUrl.startsWith('/uploads/') || remoteUrl.startsWith('/images/')) {
    return remoteUrl
  }

  // Must be a valid HTTP/HTTPS URL
  if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
    return remoteUrl
  }

  let mediaLabel = '[media URL]'
  try { const url = new URL(remoteUrl); mediaLabel = url.origin + url.pathname } catch {}
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

    // Check if already downloaded and compressed
    if (fs.existsSync(targetFilePath)) {
      const stat = fs.statSync(targetFilePath)
      if (stat.size > 0) {
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
      return `/uploads/${subfolder}/${cleanName}.svg`
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

    await sharpInstance.toFile(targetFilePath)

    const newSize = fs.statSync(targetFilePath).size
    const savedPct = Math.round((1 - newSize / (originalSize || 1)) * 100)
    console.log(
      `[Media Optimizer] Saved & compressed ${outputFilename}: ${(originalSize / 1024).toFixed(
        1
      )}KB -> ${(newSize / 1024).toFixed(1)}KB (${savedPct}% saved)`
    )

    return relativeUrl
  } catch (err: any) {
    console.warn(`[Media Optimizer] Failed to process ${mediaLabel}:`, err.name || 'MediaError')
    // Graceful fallback to original URL
    return remoteUrl
  }
}

/**
 * Scans article HTML content for images, downloads and compresses any remote
 * WordPress images locally, and updates their <img> src to the local path.
 */
export async function localizeAndOptimizeContentImages(
  htmlContent: string,
  subfolder: string = 'articles'
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

    // Only process images from unimasi or common uploads
    if (
      remoteSrc.includes('unimasi.com') ||
      remoteSrc.includes('wp-content/uploads')
    ) {
      try {
        const localSrc = await downloadAndOptimizeImage(remoteSrc, subfolder)
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
