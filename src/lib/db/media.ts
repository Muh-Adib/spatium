import 'server-only'
import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {
  MediaMetadata,
  MediaAuditReport,
  MediaAuditIssue,
  Locale,
} from '../seo/schema'

export interface MediaFilterOptions {
  search?: string
  filter?: 'all' | 'missing_alt' | 'unused' | 'oversized'
  mimeType?: string
  page?: number
  pageSize?: number
}

/**
 * Normalizes filename to slug-friendly format (lowercase, hyphens, safe chars)
 */
export function slugifyFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const base = path.basename(fileName, ext)
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${cleanBase || 'media'}${ext}`
}

/**
 * Scan public/uploads directory and sync untracked files into media_items table
 */
export async function syncLocalMediaFiles(): Promise<number> {
  const publicDir = path.join(process.cwd(), 'public')
  const uploadDirs = [
    path.join(publicDir, 'uploads'),
    path.join(publicDir, 'uploads', 'articles'),
    path.join(publicDir, 'uploads', 'pages'),
    path.join(publicDir, 'images', 'articles'),
  ]

  let added = 0
  const existingRows = await prisma.orm.public.MediaItem.all()
  const existingUrls = new Set(existingRows.map((r: any) => r.url))

  for (const dir of uploadDirs) {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) continue
    const files = fs.readdirSync(/*turbopackIgnore: true*/ dir)

    for (const file of files) {
      if (!/\.(jpe?g|png|webp|avif|svg|gif)$/i.test(file)) continue
      const fullPath = path.join(/*turbopackIgnore: true*/ dir, file)
      const relUrl = fullPath.replace(publicDir, '').replace(/\\/g, '/')

      if (!existingUrls.has(relUrl)) {
        try {
          const stat = fs.statSync(/*turbopackIgnore: true*/ fullPath)
          let width: number | undefined
          let height: number | undefined
          let mimeType = 'image/jpeg'

          if (file.endsWith('.png')) mimeType = 'image/png'
          else if (file.endsWith('.webp')) mimeType = 'image/webp'
          else if (file.endsWith('.avif')) mimeType = 'image/avif'
          else if (file.endsWith('.svg')) mimeType = 'image/svg+xml'

          if (!file.endsWith('.svg')) {
            try {
              const meta = await sharp(fullPath).metadata()
              width = meta.width
              height = meta.height
            } catch (err) { console.warn("[observable error]:", err) }
          }

          await prisma.orm.public.MediaItem.create({
              fileName: file,
              url: relUrl,
              size: stat.size,
              mimeType,
              width: width || 800,
              height: height || 600,
              altText: JSON.stringify({ id: '', en: '' }),
              focalPoint: JSON.stringify({ x: 50, y: 50 }),
              usedIn: JSON.stringify([]),
              uploadedBy: 'system_import',
            })

          existingUrls.add(relUrl)
          added++
        } catch (err) {
          console.warn(`[MediaSync] Failed to process ${file}:`, err)
        }
      }
    }
  }

  return added
}

/**
 * Get paginated media items with filters
 */
export async function getMediaItems(options: MediaFilterOptions = {}) {
  const { search = '', filter = 'all', page = 1, pageSize = 36 } = options
  const offset = (page - 1) * pageSize

  // Ensure files are synced
  await syncLocalMediaFiles().catch(() => null)

  const allItems = await prisma.orm.public.MediaItem.orderBy((m: any) => m.id.desc()).all()

  let filtered = allItems.map((item: any) => {
    let altTextObj = { id: '', en: '' }
    try {
      if (item.altText) {
        if (item.altText.startsWith('{')) {
          altTextObj = JSON.parse(item.altText)
        } else {
          altTextObj = { id: item.altText, en: item.altText }
        }
      }
    } catch {
      altTextObj = { id: item.altText || '', en: item.altText || '' }
    }

    let focalPointObj = { x: 50, y: 50 }
    try {
      if (item.focalPoint) {
        if (item.focalPoint.startsWith('{')) {
          focalPointObj = JSON.parse(item.focalPoint)
        }
      }
    } catch (err) { console.warn("[observable error]:", err) }

    let usedInArr: string[] = []
    try {
      if (item.usedIn) {
        if (item.usedIn.startsWith('[')) {
          usedInArr = JSON.parse(item.usedIn)
        } else {
          usedInArr = [item.usedIn]
        }
      }
    } catch {
      if (item.usedIn) usedInArr = [item.usedIn]
    }

    return {
      ...item,
      altText: altTextObj,
      focalPoint: focalPointObj,
      usedIn: usedInArr,
    }
  })

  // Filter conditions
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(
      (it: any) =>
        it.fileName.toLowerCase().includes(s) ||
        it.url.toLowerCase().includes(s) ||
        it.title?.toLowerCase().includes(s) ||
        it.altText.id.toLowerCase().includes(s) ||
        it.altText.en.toLowerCase().includes(s)
    )
  }

  if (filter === 'missing_alt') {
    filtered = filtered.filter(
      (it: any) => !it.decorative && (!it.altText.id?.trim() || !it.altText.en?.trim())
    )
  } else if (filter === 'unused') {
    filtered = filtered.filter((it: any) => it.usedIn.length === 0)
  } else if (filter === 'oversized') {
    filtered = filtered.filter((it: any) => (it.size || 0) > 800 * 1024) // > 800 KB
  }

  const total = filtered.length
  const paginated = filtered.slice(offset, offset + pageSize)

  return {
    items: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get single media item by ID or URL
 */
export async function getMediaItem(idOrUrl: number | string) {
  const row = typeof idOrUrl === 'number'
    ? await prisma.orm.public.MediaItem.where({ id: idOrUrl }).first()
    : await prisma.orm.public.MediaItem.where({ url: idOrUrl }).first()

  if (!row) return null

  let altTextObj = { id: '', en: '' }
  try {
    if (row.altText) {
      if (row.altText.startsWith('{')) {
        altTextObj = JSON.parse(row.altText)
      } else {
        altTextObj = { id: row.altText, en: row.altText }
      }
    }
  } catch {
    altTextObj = { id: row.altText || '', en: row.altText || '' }
  }

  let focalPointObj = { x: 50, y: 50 }
  try {
    if (row.focalPoint) {
      if (row.focalPoint.startsWith('{')) {
        focalPointObj = JSON.parse(row.focalPoint)
      }
    }
  } catch (err) { console.warn("[observable error]:", err) }

  let usedInArr: string[] = []
  try {
    if (row.usedIn) {
      if (row.usedIn.startsWith('[')) {
        usedInArr = JSON.parse(row.usedIn)
      } else {
        usedInArr = [row.usedIn]
      }
    }
  } catch {
    if (row.usedIn) usedInArr = [row.usedIn]
  }

  return {
    ...row,
    altText: altTextObj,
    focalPoint: focalPointObj,
    usedIn: usedInArr,
  }
}

/**
 * Update media item metadata (Alt text per locale, title, caption, description, focal point)
 */
export async function updateMediaItem(
  id: number,
  patch: Partial<MediaMetadata> & { altText?: { id?: string; en?: string } }
) {
  const current = await getMediaItem(id)
  if (!current) throw new Error(`Media item with ID ${id} not found`)

  const updatedAltText = {
    id: patch.altText?.id !== undefined ? patch.altText.id : current.altText.id,
    en: patch.altText?.en !== undefined ? patch.altText.en : current.altText.en,
  }

  const updatedFocal = patch.focalPoint
    ? JSON.stringify(patch.focalPoint)
    : JSON.stringify(current.focalPoint)

  await prisma.orm.public.MediaItem.where({ id }).update({
      altText: JSON.stringify(updatedAltText),
      title: patch.title !== undefined ? patch.title : current.title,
      caption: patch.caption !== undefined ? patch.caption : current.caption,
      description: patch.description !== undefined ? patch.description : current.description,
      decorative: patch.decorative !== undefined ? patch.decorative : current.decorative,
      focalPoint: updatedFocal,
      credit: patch.credit !== undefined ? patch.credit : current.credit,
    })

  return getMediaItem(id)
}

/**
 * Renames a media file:
 * 1. Renames physical file on disk
 * 2. Creates automated 301 redirect from old URL to new URL in redirects table
 * 3. Updates all references in database articles, portfolios, services, and pages
 * 4. Updates media_items record
 */
export async function renameMediaItem(id: number, newRawFileName: string) {
  const item = await getMediaItem(id)
  if (!item) throw new Error(`Media item ${id} not found`)

  const newFileName = slugifyFileName(newRawFileName)
  const oldUrl = item.url
  const oldPath = path.join(process.cwd(), 'public', oldUrl.replace(/^\//, ''))
  const dir = path.dirname(oldPath)
  const newPath = path.join(/*turbopackIgnore: true*/ dir, newFileName)
  const newUrl = oldUrl.replace(path.basename(oldUrl), newFileName)

  if (oldUrl === newUrl) {
    return item
  }

  // Rename physical file
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath)
  }

  // 1. Insert or update 301 redirect
  const existingRedir = await prisma.orm.public.Redirect.where({ sourcePath: oldUrl }).first()
  if (existingRedir) {
    await prisma.orm.public.Redirect.where({ id: existingRedir.id }).update({ destinationPath: newUrl, statusCode: 301 })
  } else {
    await prisma.orm.public.Redirect.create({
        sourcePath: oldUrl,
        destinationPath: newUrl,
        statusCode: 301,
        reason: `Automated 301 redirect: Media renamed from ${item.fileName} to ${newFileName}`,
        active: true,
      })
  }

  // 2. Update references in articles
  const allArticles = await prisma.orm.public.Article.all()
  for (const art of allArticles) {
    let changed = false
    const updateData: any = {}
    if (art.content?.includes(oldUrl)) {
      updateData.content = art.content.replaceAll(oldUrl, newUrl)
      changed = true
    }
    if (art.featuredImage?.includes(oldUrl)) {
      updateData.featuredImage = art.featuredImage.replaceAll(oldUrl, newUrl)
      changed = true
    }
    if (art.coverUrl?.includes(oldUrl)) {
      updateData.coverUrl = art.coverUrl.replaceAll(oldUrl, newUrl)
      changed = true
    }
    if (changed) {
      await prisma.orm.public.Article.where({ id: art.id }).update(updateData)
    }
  }

  // 3. Update references in portfolios
  const allPortfolios = await prisma.orm.public.Portfolio.all()
  for (const port of allPortfolios) {
    let changed = false
    const updateData: any = {}
    if (port.heroImage?.includes(oldUrl)) {
      updateData.heroImage = port.heroImage.replaceAll(oldUrl, newUrl)
      changed = true
    }
    if (port.summary?.includes(oldUrl)) {
      updateData.summary = port.summary.replaceAll(oldUrl, newUrl)
      changed = true
    }
    if (changed) {
      await prisma.orm.public.Portfolio.where({ id: port.id }).update(updateData)
    }
  }

  // 4. Update references in services
  const allServices = await prisma.orm.public.Service.all()
  for (const svc of allServices) {
    if (svc.heroImage?.includes(oldUrl)) {
      await prisma.orm.public.Service.where({ id: svc.id }).update({ heroImage: svc.heroImage.replaceAll(oldUrl, newUrl) })
    }
  }

  // 5. Update media_items record
  await prisma.orm.public.MediaItem.where({ id }).update({
      fileName: newFileName,
      url: newUrl,
    })

  return getMediaItem(id)
}

/**
 * Scan all media and generate comprehensive Media Audit report (Section 5.5)
 */
export async function generateMediaAudit(): Promise<MediaAuditReport> {
  await syncLocalMediaFiles().catch(() => null)
  const items = await prisma.orm.public.MediaItem.all()

  const issues: MediaAuditIssue[] = []
  const seenAlts = new Map<string, string>()

  let missingAltCount = 0
  let oversizedCount = 0
  let badFilenameCount = 0
  let unusedCount = 0

  for (const item of items) {
    let altTextObj = { id: '', en: '' }
    try {
      if (item.altText) altTextObj = JSON.parse(item.altText)
    } catch (err) { console.warn("[observable error]:", err) }

    let usedInArr: string[] = []
    try {
      if (item.usedIn) usedInArr = JSON.parse(item.usedIn)
    } catch (err) { console.warn("[observable error]:", err) }

    // Check 1: Missing Alt Text (per locale)
    if (!item.decorative) {
      if (!altTextObj.id || !altTextObj.id.trim()) {
        missingAltCount++
        issues.push({
          id: `media-alt-id-${item.id}`,
          mediaId: item.id,
          url: item.url,
          fileName: item.fileName,
          type: 'missing_alt_id',
          severity: 'critical',
          message: `Gambar belum memiliki Alt Text untuk Bahasa Indonesia (ID).`,
        })
      }
      if (!altTextObj.en || !altTextObj.en.trim()) {
        issues.push({
          id: `media-alt-en-${item.id}`,
          mediaId: item.id,
          url: item.url,
          fileName: item.fileName,
          type: 'missing_alt_en',
          severity: 'warning',
          message: `Gambar belum memiliki Alt Text untuk Bahasa Inggris (EN).`,
        })
      }
    }

    // Check 2: Duplicate Alt Text
    if (altTextObj.id && altTextObj.id.trim().length > 10) {
      const trimmed = altTextObj.id.trim().toLowerCase()
      if (seenAlts.has(trimmed)) {
        issues.push({
          id: `media-alt-dup-${item.id}`,
          mediaId: item.id,
          url: item.url,
          fileName: item.fileName,
          type: 'duplicate_alt',
          severity: 'warning',
          message: `Alt text duplikat dengan file "${seenAlts.get(trimmed)}".`,
        })
      } else {
        seenAlts.set(trimmed, item.fileName)
      }
    }

    // Check 3: Bad Filename (IMG_, DSC_, Screenshot)
    if (/^(IMG_|DSC_|Screenshot|Pasted|image[0-9]*\.)/i.test(item.fileName)) {
      badFilenameCount++
      issues.push({
        id: `media-fn-${item.id}`,
        mediaId: item.id,
        url: item.url,
        fileName: item.fileName,
        type: 'bad_filename',
        severity: 'warning',
        message: `Nama file tidak deskriptif (${item.fileName}). Rename dengan nama berbasis kata kunci untuk SEO Gambar.`,
      })
    }

    // Check 4: Oversized Image (> 800 KB)
    if ((item.size || 0) > 800 * 1024) {
      oversizedCount++
      const sizeMb = ((item.size || 0) / (1024 * 1024)).toFixed(2)
      issues.push({
        id: `media-size-${item.id}`,
        mediaId: item.id,
        url: item.url,
        fileName: item.fileName,
        type: 'oversized_image',
        severity: (item.size || 0) > 2 * 1024 * 1024 ? 'critical' : 'warning',
        message: `Ukuran file sangat besar (${sizeMb} MB). Kompres ke format WebP/AVIF untuk mencegah penurunan Core Web Vitals (LCP).`,
      })
    }

    // Check 5: Unused Media
    if (usedInArr.length === 0) {
      unusedCount++
    }
  }

  return {
    totalScanned: items.length,
    missingAltCount,
    oversizedCount,
    badFilenameCount,
    unusedCount,
    issues,
    scannedAt: new Date().toISOString(),
  }
}

export interface ArticleImageMatch {
  url: string
  alt: string
  title: string
  caption: string
}

/**
 * Auto-Matcher: selects featured images and illustrations based on keyword, city, category, and brand.
 * Automatically injects alt, title, and caption with the primaryKeyword for Technical Image SEO.
 */
export function matchImageForArticle(
  keywordOrOptions: string | { primaryKeyword?: string; keyword?: string; city?: string; category?: string },
  cityArg: string = '',
  categoryArg: string = 'Teknologi'
): ArticleImageMatch {
  let keyword = ''
  let city = ''
  let category = categoryArg

  if (typeof keywordOrOptions === 'object' && keywordOrOptions !== null) {
    keyword = keywordOrOptions.primaryKeyword || keywordOrOptions.keyword || ''
    city = keywordOrOptions.city || ''
    category = keywordOrOptions.category || categoryArg
  } else {
    keyword = String(keywordOrOptions || '')
    city = String(cityArg || '')
  }

  const kwLower = keyword.toLowerCase()
  const cityLower = city.toLowerCase()

  let url = '/images/articles/web-architecture.jpg'

  // 1. City Matching from web/public/images/cities/
  if (cityLower.includes('bali') || cityLower.includes('denpasar')) url = '/images/cities/bali-1.jpg'
  else if (cityLower.includes('jakarta')) url = '/images/cities/jakarta-1.jpg'
  else if (cityLower.includes('surabaya')) url = '/images/cities/surabaya-1.jpg'
  else if (cityLower.includes('bandung')) url = '/images/cities/bandung-1.jpg'
  else if (cityLower.includes('semarang')) url = '/images/cities/semarang-1.jpg'
  else if (cityLower.includes('jogja') || cityLower.includes('yogyakarta')) url = '/images/cities/jogja-1.jpg'
  else if (cityLower.includes('bekasi')) url = '/images/cities/bekasi-1.jpg'
  else if (cityLower.includes('bogor')) url = '/images/cities/bogor-1.jpg'
  else if (cityLower.includes('depok')) url = '/images/cities/depok-1.jpg'
  else if (cityLower.includes('cikarang')) url = '/images/cities/cikarang-1.jpg'
  else if (cityLower.includes('karawang')) url = '/images/cities/karawang-1.jpg'
  else if (cityLower.includes('solo') || cityLower.includes('surakarta')) url = '/images/cities/solo-1.jpg'
  else if (cityLower.includes('medan')) url = '/images/cities/medan-1.jpg'
  else if (cityLower.includes('makassar')) url = '/images/cities/makassar-1.jpg'
  else if (cityLower.includes('palembang')) url = '/images/cities/palembang-1.jpg'
  else if (cityLower.includes('batam')) url = '/images/cities/batam-1.jpg'
  else if (cityLower.includes('tangerang')) url = '/images/cities/tangerang-1.jpg'
  else if (cityLower.includes('aceh')) url = '/images/cities/aceh-1.jpg'
  else if (cityLower.includes('cilegon')) url = '/images/cities/cilegon-1.jpg'
  // 2. Service & Technology Keyword Matching from web/public/images/articles/
  else if (kwLower.includes('3d') || kwLower.includes('virtual') || kwLower.includes('three.js')) url = '/images/articles/3d-virtual-reality.jpg'
  else if (kwLower.includes('ai') || kwLower.includes('artificial') || kwLower.includes('intelligence') || kwLower.includes('llm')) url = '/images/articles/ai-apps-production.jpg'
  else if (kwLower.includes('lms') || kwLower.includes('learning') || kwLower.includes('sekolah') || kwLower.includes('edukasi')) url = '/images/articles/lms-digital-classroom.jpg'
  else if (kwLower.includes('erp') || kwLower.includes('manufaktur') || kwLower.includes('iot') || kwLower.includes('scada')) url = '/images/articles/erp-enterprise-system.jpg'
  else if (kwLower.includes('toko online') || kwLower.includes('ecommerce') || kwLower.includes('e-commerce')) url = '/images/articles/ecommerce-web-platform.jpg'
  else if (kwLower.includes('landing page')) url = '/images/articles/landing-page-development.jpg'
  else if (kwLower.includes('mobile app') || kwLower.includes('aplikasi mobile') || kwLower.includes('android')) url = '/images/articles/mobile-app-development.jpg'
  else if (kwLower.includes('seo') || kwLower.includes('optimasi')) url = '/images/articles/seo-growth-analytics.jpg'
  else if (kwLower.includes('ui/ux') || kwLower.includes('desain')) url = '/images/articles/ui-ux-design-system.jpg'
  else if (kwLower.includes('brand') || kwLower.includes('branding') || kwLower.includes('logo')) url = '/images/articles/brand-identity-design.jpg'
  else if (kwLower.includes('simrs') || kwLower.includes('rumah sakit') || kwLower.includes('medis') || kwLower.includes('kesehatan')) url = '/images/articles/healthcare-hospital-system.jpg'

  const brandName = 'SPATIUM'

  const displayKw = keyword || 'Teknologi Digital'
  const displayCity = city ? ` di ${city}` : ''
  const displayCityOnly = city ? ` ${city}` : ''

  return {
    url,
    alt: `Layanan ${displayKw}${displayCity} oleh ${brandName}`,
    title: `Spesialisasi ${displayKw}${displayCityOnly} — ${brandName}`,
    caption: `Implementasi solusi rekayasa ${displayKw}${city ? ` untuk wilayah ${city} dan sekitarnya` : ''} oleh ${brandName}.`,
  }
}

export const autoMatchArticleMedia = matchImageForArticle
