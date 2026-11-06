import 'server-only'
import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { MediaAuditReport, MediaAuditIssue } from '../seo/schema'
import { PublicError } from '@/lib/http/errors'
import type { MediaMetadataPatch } from '@/lib/media/media-schema'

export interface MediaFilterOptions {
  search?: string
  filter?: 'all' | 'missing_alt' | 'unused' | 'oversized'
  mimeType?: string
  page?: number
  pageSize?: number
}

type MediaRow = {
  id: number
  fileName: string
  url: string
  altText: string | null
  title: string | null
  caption: string | null
  description: string | null
  decorative: boolean | null
  focalPoint: string | null
  credit: string | null
  width: number | null
  height: number | null
  size: number | null
  mimeType: string | null
  blurHash: string | null
  usedIn: string | null
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

export type MediaRecord = Omit<MediaRow, 'altText' | 'focalPoint' | 'usedIn'> & {
  altText: { id: string; en: string }
  focalPoint: { x: number; y: number }
  usedIn: string[]
}

type Tx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

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

function parseAltText(raw: string | null): { id: string; en: string } {
  if (!raw) return { id: '', en: '' }
  if (!raw.startsWith('{')) return { id: raw, en: raw }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>
      return { id: typeof o.id === 'string' ? o.id : '', en: typeof o.en === 'string' ? o.en : '' }
    }
  } catch (err) {
    console.warn('[media] invalid altText JSON:', err)
  }
  return { id: raw, en: raw }
}

function parseFocalPoint(raw: string | null): { x: number; y: number } {
  if (raw?.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const o = parsed as Record<string, unknown>
        if (typeof o.x === 'number' && typeof o.y === 'number') return { x: o.x, y: o.y }
      }
    } catch (err) {
      console.warn('[media] invalid focalPoint JSON:', err)
    }
  }
  return { x: 50, y: 50 }
}

function parseUsedIn(raw: string | null): string[] {
  if (!raw) return []
  if (!raw.startsWith('[')) return [raw]
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch (err) {
    console.warn('[media] invalid usedIn JSON:', err)
    return [raw]
  }
}

function toMediaRecord(row: MediaRow): MediaRecord {
  return {
    ...row,
    altText: parseAltText(row.altText),
    focalPoint: parseFocalPoint(row.focalPoint),
    usedIn: parseUsedIn(row.usedIn),
  }
}

async function auditMedia(tx: Tx, mediaId: number, action: string, actor: string, diff?: Record<string, unknown>) {
  await tx.orm.public.SeoAuditLog.create({
    entityType: 'media',
    entityId: String(mediaId),
    action,
    actor,
    diff: diff ? JSON.stringify(diff) : null,
  })
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
  const existingRows = (await prisma.orm.public.MediaItem.all()) as MediaRow[]
  const existingUrls = new Set(existingRows.map((r) => r.url))

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
          else if (file.endsWith('.gif')) mimeType = 'image/gif'
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

async function syncLogged(): Promise<void> {
  try {
    await syncLocalMediaFiles()
  } catch (err) {
    console.warn('[media] syncing files from public/uploads failed:', err)
  }
}

/**
 * Get paginated media items with filters
 */
export async function getMediaItems(options: MediaFilterOptions = {}) {
  const { search = '', filter = 'all', page = 1, pageSize = 36 } = options
  const offset = (page - 1) * pageSize

  // Files written outside the library (legacy uploads, deploy assets) still get a row.
  await syncLogged()

  const rows = (await prisma.orm.public.MediaItem.orderBy((m) => m.id.desc()).all()) as MediaRow[]
  let filtered = rows.map(toMediaRecord)

  // Filter conditions
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(
      (it) =>
        it.fileName.toLowerCase().includes(s) ||
        it.url.toLowerCase().includes(s) ||
        Boolean(it.title?.toLowerCase().includes(s)) ||
        it.altText.id.toLowerCase().includes(s) ||
        it.altText.en.toLowerCase().includes(s)
    )
  }

  if (filter === 'missing_alt') {
    filtered = filtered.filter((it) => !it.decorative && (!it.altText.id.trim() || !it.altText.en.trim()))
  } else if (filter === 'unused') {
    filtered = filtered.filter((it) => it.usedIn.length === 0)
  } else if (filter === 'oversized') {
    filtered = filtered.filter((it) => (it.size || 0) > 800 * 1024) // > 800 KB
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
export async function getMediaItem(idOrUrl: number | string): Promise<MediaRecord | null> {
  const row = (typeof idOrUrl === 'number'
    ? await prisma.orm.public.MediaItem.where({ id: idOrUrl }).first()
    : await prisma.orm.public.MediaItem.where({ url: idOrUrl }).first()) as MediaRow | null

  return row ? toMediaRecord(row) : null
}

/** A file already written under public/uploads, to be registered in the library. */
export type NewMediaFile = {
  fileName: string
  url: string
  size: number
  mimeType: string
  width: number | null
  height: number | null
  altText?: { id: string; en: string }
  title?: string
  caption?: string
}

/**
 * Registers an uploaded file in the media library, attributed to `uploadedBy`
 * (the Studio user id), with its audit entry in the same transaction.
 */
export async function registerMediaItem(file: NewMediaFile, uploadedBy: string, actor: string): Promise<MediaRecord> {
  return prisma.transaction(async (tx) => {
    const row = (await tx.orm.public.MediaItem.create({
      fileName: file.fileName,
      url: file.url,
      size: file.size,
      mimeType: file.mimeType,
      width: file.width,
      height: file.height,
      altText: JSON.stringify(file.altText ?? { id: '', en: '' }),
      title: file.title || file.fileName,
      caption: file.caption ?? '',
      focalPoint: JSON.stringify({ x: 50, y: 50 }),
      usedIn: JSON.stringify([]),
      uploadedBy,
    })) as MediaRow
    await auditMedia(tx, row.id, 'MEDIA_UPLOAD', actor, { url: file.url, mimeType: file.mimeType, size: file.size })
    return toMediaRecord(row)
  })
}

/**
 * Update media item metadata (Alt text per locale, title, caption, description, focal point)
 */
export async function updateMediaItem(id: number, patch: MediaMetadataPatch, actor: string): Promise<MediaRecord> {
  return prisma.transaction(async (tx) => {
    const row = (await tx.orm.public.MediaItem.where({ id }).forUpdate().first()) as MediaRow | null
    if (!row) throw new PublicError(`Media dengan ID ${id} tidak ditemukan.`, 404)
    const current = toMediaRecord(row)

    const values: Record<string, unknown> = {}
    if (patch.altText) {
      values.altText = JSON.stringify({
        id: patch.altText.id ?? current.altText.id,
        en: patch.altText.en ?? current.altText.en,
      })
    }
    if (patch.focalPoint) values.focalPoint = JSON.stringify(patch.focalPoint)
    if (patch.title !== undefined) values.title = patch.title
    if (patch.caption !== undefined) values.caption = patch.caption
    if (patch.description !== undefined) values.description = patch.description
    if (patch.decorative !== undefined) values.decorative = patch.decorative
    if (patch.credit !== undefined) values.credit = patch.credit

    if (Object.keys(values).length > 0) {
      await tx.orm.public.MediaItem.where({ id }).update(values)
      await auditMedia(tx, id, 'MEDIA_UPDATE', actor, { fields: Object.keys(values) })
    }
    const updated = (await tx.orm.public.MediaItem.where({ id }).first()) as MediaRow
    return toMediaRecord(updated)
  })
}

/** Deletes the library row (with an audit entry). The caller removes the file afterwards. */
export async function deleteMediaItem(id: number, actor: string): Promise<void> {
  await prisma.transaction(async (tx) => {
    const row = (await tx.orm.public.MediaItem.where({ id }).forUpdate().first()) as MediaRow | null
    if (!row) throw new PublicError('Media tidak ditemukan.', 404)
    await tx.orm.public.MediaItem.where({ id }).delete()
    await auditMedia(tx, id, 'MEDIA_DELETE', actor, { url: row.url, fileName: row.fileName })
  })
}

/** Slugs of published content whose stored image URLs a rename rewrote. */
export type RenameTouched = { articles: string[]; portfolios: string[]; services: string[] }

/**
 * Renames a media file:
 * 1. Renames physical file on disk (the extension never changes)
 * 2. In one transaction: 301 redirect old → new URL, rewrite references in
 *    articles, portfolios and services, update the media row, audit entry.
 * If the transaction fails the file is moved back.
 */
export async function renameMediaItem(
  id: number,
  newRawFileName: string,
  actor: string,
): Promise<{ item: MediaRecord; touched: RenameTouched }> {
  const item = await getMediaItem(id)
  if (!item) throw new PublicError('Media tidak ditemukan.', 404)

  // Keep the real extension: the bytes on disk do not change format.
  const ext = path.extname(item.fileName).toLowerCase()
  const base = slugifyFileName(path.basename(newRawFileName, path.extname(newRawFileName)))
  const newFileName = `${base}${ext}`
  const oldUrl = item.url
  const newUrl = `${path.posix.dirname(oldUrl)}/${newFileName}`
  const touched: RenameTouched = { articles: [], portfolios: [], services: [] }

  if (oldUrl === newUrl) {
    return { item, touched }
  }

  const publicDir = path.resolve(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, 'uploads')
  const oldPath = path.resolve(publicDir, oldUrl.replace(/^\//, ''))
  const newPath = path.resolve(publicDir, newUrl.replace(/^\//, ''))
  if (!newPath.startsWith(uploadsDir + path.sep) || !oldPath.startsWith(uploadsDir + path.sep)) {
    throw new PublicError('Hanya file di folder uploads yang dapat diganti namanya.')
  }
  if (fs.existsSync(newPath) || (await prisma.orm.public.MediaItem.where({ url: newUrl }).first())) {
    throw new PublicError(`Nama file "${newFileName}" sudah dipakai. Pilih nama lain.`, 409)
  }

  const fileMoved = fs.existsSync(oldPath)
  if (fileMoved) fs.renameSync(oldPath, newPath)

  try {
    await prisma.transaction(async (tx) => {
      await tx.orm.public.Redirect.upsert({
        conflictOn: { sourcePath: oldUrl },
        create: {
          sourcePath: oldUrl,
          destinationPath: newUrl,
          statusCode: 301,
          reason: `Automated 301 redirect: Media renamed from ${item.fileName} to ${newFileName}`,
          active: true,
        },
        update: { destinationPath: newUrl, statusCode: 301, active: true },
      })

      const articles = await tx.orm.public.Article.all()
      for (const art of articles) {
        const values: Record<string, string> = {}
        if (art.content?.includes(oldUrl)) values.content = art.content.replaceAll(oldUrl, newUrl)
        if (art.featuredImage?.includes(oldUrl)) values.featuredImage = art.featuredImage.replaceAll(oldUrl, newUrl)
        if (art.coverUrl?.includes(oldUrl)) values.coverUrl = art.coverUrl.replaceAll(oldUrl, newUrl)
        if (Object.keys(values).length > 0) {
          await tx.orm.public.Article.where({ id: art.id }).update(values)
          touched.articles.push(art.slug)
        }
      }

      const portfolios = await tx.orm.public.Portfolio.all()
      for (const port of portfolios) {
        const values: Record<string, string> = {}
        if (port.heroImage?.includes(oldUrl)) values.heroImage = port.heroImage.replaceAll(oldUrl, newUrl)
        if (port.summary?.includes(oldUrl)) values.summary = port.summary.replaceAll(oldUrl, newUrl)
        if (Object.keys(values).length > 0) {
          await tx.orm.public.Portfolio.where({ id: port.id }).update(values)
          touched.portfolios.push(port.slug)
        }
      }

      const services = await tx.orm.public.Service.all()
      for (const svc of services) {
        if (svc.heroImage?.includes(oldUrl)) {
          await tx.orm.public.Service.where({ id: svc.id }).update({ heroImage: svc.heroImage.replaceAll(oldUrl, newUrl) })
          touched.services.push(svc.slug)
        }
      }

      await tx.orm.public.MediaItem.where({ id }).update({ fileName: newFileName, url: newUrl })
      await auditMedia(tx, id, 'MEDIA_RENAME', actor, { from: oldUrl, to: newUrl, references: touched })
    })
  } catch (err) {
    if (fileMoved) {
      try {
        fs.renameSync(newPath, oldPath)
      } catch (rollbackErr) {
        console.error('[media] rename rollback failed; file left at', newPath, rollbackErr)
      }
    }
    throw err
  }

  const renamed = await getMediaItem(id)
  if (!renamed) throw new PublicError('Media tidak ditemukan setelah rename.', 404)
  return { item: renamed, touched }
}

/**
 * Scan all media and generate comprehensive Media Audit report (Section 5.5)
 */
export async function generateMediaAudit(): Promise<MediaAuditReport> {
  await syncLogged()
  const items = (await prisma.orm.public.MediaItem.all()) as MediaRow[]

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
