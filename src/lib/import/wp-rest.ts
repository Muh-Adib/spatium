import { parseRobots } from '@/lib/seo/robots'
import { prisma } from '@/lib/db/prisma'
import { cleanWpHtml, stripHtml, calculateReadingTime } from './transform'
import { downloadAndOptimizeImage, localizeAndOptimizeContentImages } from './media-storage'
import { extractWordPressSeo } from './seo-extractor'
import { wordpressCollection, normalizeWordPressSource, contentHash, localContentHash, wordpressDate, type WordPressConnection } from './wp-client'

export interface WpImportOptions extends WordPressConnection {
  jobId: string
  brand?: 'unimasi' | 'unimasi' | 'erfomultimedia'
  defaultAuthorName?: string
  actor?: string
  onProgress?: (progress: { imported: number; total: number; message: string; log?: string }) => void
}

function seoFields(post: Record<string, any>, title: string, excerpt: string, image: string | null, sourceUrl: string = 'https://www.unimasi.com') {
  return extractWordPressSeo(post, title, excerpt, image, sourceUrl)
}

export async function importFromWordPressRest(options: WpImportOptions) {
  const sourceUrl = normalizeWordPressSource(options.siteUrl)
  const actor = options.actor || 'wordpress-import'
  const logs: string[] = []
  const errors: Array<{ entity: string; id?: number; error: string }> = []
  let imported = 0, importedPages = 0, skipped = 0, conflicts = 0, archived = 0
  const report = () => ({ imported, importedPages, skipped, conflicts, archived, errors, recentLogs: logs, coverage: options.completeExport ? 'complete_export' : options.applicationPassword ? 'authenticated_rest' : 'public_only', sourceUrl })
  const progress = async (message: string) => {
    logs.push(message); if (logs.length > 30) logs.shift()
    options.onProgress?.({ imported, total: imported + skipped + conflicts, message })
    await prisma.orm.public.ImportJob.where({ id: options.jobId }).update({ report: JSON.stringify({ ...report(), currentStep: message }), imported, skipped, errors: errors.length })
  }
  /** Preserve every response before transforming any content. Keep previous source versions as revisions. */
  const archive = async (entityType: string, raw: Record<string, any>) => {
    const key = { sourceUrl, entityType, wpId: raw.id }
    const previous = await prisma.orm.public.WordPressSnapshot.where(key).first()
    const sourceHash = contentHash(raw)
    return prisma.transaction(async (tx) => {
      if (previous && previous.sourceHash !== sourceHash) await tx.orm.public.ContentRevision.create({ entityType: 'wordpress_snapshot', entityId: String(previous.id), actor, action: 'source_updated', snapshot: JSON.stringify(previous) })
      const row = await tx.orm.public.WordPressSnapshot.upsert({ conflictOn: key, create: { ...key, sourceHash, payload: JSON.stringify(raw) }, update: { sourceHash, payload: JSON.stringify(raw), syncedAt: new Date().toISOString() } })
      archived++
      return { previous, row }
    })
  }
  await prisma.orm.public.ImportJob.where({ id: options.jobId }).update({ status: 'running', startedAt: new Date().toISOString() })
  try {
    if (options.completeExport) for await (const raw of wordpressCollection(options, 'users')) await archive('users', raw)
    const categoryIds = new Map<number, number>(), categoryNames = new Map<number, string>(), tagIds = new Map<number, number>()
    for (const entity of ['categories', 'tags'] as const) {
      await progress(`Mengambil seluruh ${entity}...`)
      for await (const raw of wordpressCollection(options, entity)) {
        const { row } = await archive(entity, raw)
        const values = { name: stripHtml(raw.name || ''), slug: raw.slug }
        const saved = entity === 'categories'
          ? await prisma.orm.public.Category.upsert({ conflictOn: { slug: raw.slug }, create: { ...values, description: raw.description || null, wpTermId: raw.id }, update: { name: values.name } })
          : await prisma.orm.public.Tag.upsert({ conflictOn: { slug: raw.slug }, create: values, update: { name: values.name } })
        ;(entity === 'categories' ? categoryIds : tagIds).set(raw.id, saved.id)
        if (entity === 'categories') categoryNames.set(raw.id, values.name)
        await prisma.orm.public.WordPressSnapshot.where({ id: row.id }).update({ targetId: saved.id, status: 'imported' })
      }
    }
    for (const entity of ['posts', 'pages'] as const) {
      await progress(`Mengambil seluruh ${entity} beserta metadata...`)
      for await (const raw of wordpressCollection(options, entity)) {
        const { previous, row } = await archive(entity, raw)
        try {
          let existing: any = previous?.targetId ? (entity === 'posts' ? await prisma.orm.public.Article.where({ id: previous.targetId }).first() : await prisma.orm.public.Page.where({ id: previous.targetId }).first()) : null
          // Adopt only an existing WP article with matching source identity, never an arbitrary slug.
          if (!existing && entity === 'posts') {
            const candidates = await prisma.orm.public.Article.where({ wpPostId: raw.id }).all()
            existing = candidates.find((a) => a.wpSourceUrl && raw.link && a.wpSourceUrl.replace(/\/$/, '') === raw.link.replace(/\/$/, '')) || null
          }
          if (existing && previous?.localHash && localContentHash(existing) !== previous.localHash) {
            conflicts++
            await prisma.orm.public.WordPressSnapshot.where({ id: row.id }).update({ status: 'conflict', error: 'Konten lokal berubah. Tinjau sumber sebelum mengganti hasil edit.' })
            continue
          }
          if (existing && previous?.sourceHash === row.sourceHash && previous.status === 'imported') {
            // Periksa apakah artikel di database lokal kehilangan metadata Yoast/focus keyphrase dan perbaiki di tempat
            if (entity === 'posts' && (!existing.focusKeyphrase || !existing.seoData || !existing.metaTitle)) {
              const image = existing.coverUrl || existing.featuredImage
              const title = existing.title
              const excerpt = existing.excerpt || ''
              const seo = seoFields(raw, title, excerpt, image, sourceUrl)
              if (seo.focusKeyphrase || !existing.seoData) {
                const repairData: Record<string, any> = {
                  metaTitle: existing.metaTitle || seo.metaTitle,
                  metaDescription: existing.metaDescription || seo.metaDescription,
                  canonicalUrl: existing.canonicalUrl || seo.canonicalUrl,
                  seoData: seo.seoData,
                  isCornerstone: seo.isCornerstone,
                  ...(seo.focusKeyphrase && !existing.focusKeyphrase ? { focusKeyphrase: seo.focusKeyphrase } : {}),
                  ...(seo.relatedKeyphrases?.length && (!existing.relatedKeyphrases || existing.relatedKeyphrases === '[]')
                    ? { relatedKeyphrases: JSON.stringify(seo.relatedKeyphrases) }
                    : {}),
                }
                const updated = await prisma.orm.public.Article.where({ id: existing.id }).update(repairData)
                if (updated) {
                  await prisma.orm.public.WordPressSnapshot.where({ id: row.id }).update({ localHash: localContentHash(updated) })
                }
              }
            }
            skipped++
            continue
          }
          const slugOwner = entity === 'posts' ? await prisma.orm.public.Article.where({ slug: raw.slug }).first() : await prisma.orm.public.Page.where({ slug: raw.slug }).first()
          if (slugOwner && slugOwner.id !== existing?.id) throw new Error(`Slug ${raw.slug} sudah digunakan konten lain. Tidak ditimpa.`)
          const media = raw._embedded?.['wp:featuredmedia']?.[0]
          if (media?.id && !options.completeExport) await archive('media', media)
          const image = media?.source_url ? await downloadAndOptimizeImage(media.source_url, entity === 'posts' ? 'articles' : 'pages') : null
          const title = stripHtml(raw.title?.rendered || raw.title?.raw || '')
          const content = await localizeAndOptimizeContentImages(cleanWpHtml(raw.content?.rendered || raw.content?.raw || ''), entity === 'posts' ? 'articles' : 'pages')
          const excerpt = stripHtml(raw.excerpt?.rendered || raw.excerpt?.raw || '')
          const seo = seoFields(raw, title, excerpt, image, sourceUrl)
          const primaryCategoryId = Number(raw.meta?._yoast_wpseo_primary_category) || raw.categories?.[0]

          const publishedAt = wordpressDate(raw.date_gmt, raw.date)
          const status = (raw.password || raw.webshift_source?.post?.post_password || raw.content?.protected) ? 'draft' : raw.status === 'publish' ? 'published' : raw.status === 'future' ? 'scheduled' : raw.status === 'pending' ? 'in_review' : 'draft'
          const common = { slug: raw.slug, title, content, excerpt, metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, seoData: seo.seoData, robots: seo.robotsDirectives, status, publishedAt, createdAt: publishedAt || undefined, updatedAt: wordpressDate(raw.modified_gmt, raw.modified) || undefined }
          let authorId: number | null = null
          const author = raw._embedded?.author?.[0]
          if (author?.id) {
            if (!options.completeExport) await archive('users', author)
            const authorSlug = `wp-${contentHash(sourceUrl).slice(0, 8)}-${author.id}`
            const saved = await prisma.orm.public.Author.upsert({ conflictOn: { slug: authorSlug }, create: { slug: authorSlug, name: author.name, bio: author.description || null, email: author.email || null, avatar: author.avatar_urls?.['96'] || null }, update: { name: author.name, bio: author.description || null } })
            authorId = saved.id
          }
          await prisma.transaction(async (tx) => {
            let saved: any
            if (existing) await tx.orm.public.ContentRevision.create({ entityType: entity === 'posts' ? 'article' : 'page', entityId: String(existing.id), actor, action: 'before_wordpress_sync', snapshot: JSON.stringify(existing) })
            if (entity === 'posts') {
              const data = { ...common, featuredImage: image, coverUrl: image, readingTime: calculateReadingTime(content), wpPostId: raw.id, wpSourceUrl: raw.link || null, canonicalUrl: seo.canonicalUrl, ogImage: seo.ogImage, focusKeyphrase: seo.focusKeyphrase, authorId, categoryId: categoryIds.get(primaryCategoryId) || null, primaryCategory: categoryNames.get(primaryCategoryId) || null, relatedKeyphrases: JSON.stringify(seo.relatedKeyphrases), isCornerstone: seo.isCornerstone, tags: JSON.stringify(raw.tags || []), scheduledAt: status === 'scheduled' ? publishedAt : null, publicationTimezone: 'UTC', scheduledBy: status === 'scheduled' ? actor : null }
              saved = existing ? await tx.orm.public.Article.where({ id: existing.id }).update(data) : await tx.orm.public.Article.create({ ...data, documentId: `wp-${contentHash(sourceUrl).slice(0, 8)}-${raw.id}` })
              await tx.execute(tx.sql.public.article_tags.delete().where((a, f) => f.eq(a.article_id, saved.id)).build())
              for (const id of raw.tags || []) {
                const tagId = tagIds.get(id)
                if (tagId) await tx.orm.public.ArticleTag.create({ articleId: saved.id, tagId })
              }
            } else {
              const data = { ...common, canonical: seo.canonicalUrl }
              saved = existing ? await tx.orm.public.Page.where({ id: existing.id }).update(data) : await tx.orm.public.Page.create({ ...data, documentId: `wp-page-${contentHash(sourceUrl).slice(0, 8)}-${raw.id}` })
            }
            await tx.orm.public.WordPressSnapshot.where({ id: row.id }).update({ targetId: saved.id, localHash: localContentHash(saved), status: 'imported', error: null })
            await tx.orm.public.ContentRevision.create({ entityType: entity === 'posts' ? 'article' : 'page', entityId: String(saved.id), actor, action: 'wordpress_sync', snapshot: JSON.stringify(saved) })
            await tx.orm.public.SeoAuditLog.create({ entityType: entity === 'posts' ? 'article' : 'page', entityId: String(saved.id), actor, action: 'wordpress_sync', diff: JSON.stringify({ sourceUrl, wpId: raw.id, sourceHash: row.sourceHash }) })
            if (raw.link && status === 'published') {
              const path = new URL(raw.link).pathname
              const target = entity === 'posts' ? `/artikel/${saved.slug}` : `/${saved.slug}`
              if (path !== '/' && path.replace(/\/$/, '') !== target) await tx.orm.public.Redirect.upsert({ conflictOn: { sourcePath: path }, create: { sourcePath: path, destinationPath: target, statusCode: 301, active: true }, update: { destinationPath: target, active: true } })
              await tx.orm.public.LegacyUrl.upsert({ conflictOn: { legacyUrl: raw.link }, create: { legacyUrl: raw.link, targetUrl: target, migrationStatus: 'migrated', postType: entity === 'posts' ? 'post' : 'page', legacyTitle: title }, update: { targetUrl: target, migrationStatus: 'migrated' } })
            }
          })
          if (entity === 'posts') imported++; else importedPages++
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Gagal menyimpan entitas WordPress.'
          errors.push({ entity, id: raw.id, error: message })
          await prisma.orm.public.WordPressSnapshot.where({ id: row.id }).update({ status: 'failed', error: message })
        }
        await progress(`${entity}: ${imported} artikel, ${importedPages} halaman tersimpan; ${conflicts} konflik.`)
      }
    }
    // The media collection preserves captions, alt, descriptions, sizes, and original URLs,
    // including unused attachments omitted by _embed.
    await progress('Mengarsipkan seluruh media lampiran...')
    try {
      for await (const raw of wordpressCollection(options, 'media')) {
        try {
          await archive('media', raw)
        } catch (mediaErr: any) {
          console.warn(`[wordpress-sync] Gagal mengarsipkan media ID ${raw?.id}:`, mediaErr?.message)
          errors.push({ entity: 'media', id: raw?.id, error: mediaErr?.message || 'Gagal arsip media' })
        }
      }
    } catch (mediaColErr: any) {
      console.warn('[wordpress-sync] Peringatan saat mengambil koleksi media:', mediaColErr?.message)
      errors.push({ entity: 'media', error: mediaColErr?.message || 'Gagal iterasi media' })
    }
    const status = errors.length || conflicts ? 'partial' : 'completed'
    await prisma.orm.public.ImportJob.where({ id: options.jobId }).update({ status, finishedAt: new Date().toISOString(), report: JSON.stringify({ ...report(), currentStep: status === 'completed' ? 'Sinkronisasi selesai untuk cakupan yang dipilih.' : 'Sinkronisasi memerlukan peninjauan.' }), imported, skipped, errors: errors.length })
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/', 'layout')
    } catch { console.warn('[wordpress-sync] Import saved; cache invalidation unavailable in this execution context.') }
    return { success: status === 'completed', imported, importedPages, total: imported + skipped + conflicts, conflicts, errors, coverage: report().coverage }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sinkronisasi gagal.'
    await prisma.orm.public.ImportJob.where({ id: options.jobId }).update({ status: 'failed', finishedAt: new Date().toISOString(), report: JSON.stringify({ ...report(), currentStep: message }) })
    throw error
  }
}
