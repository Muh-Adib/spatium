import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { extractWordPressSeo } from '@/lib/import/seo-extractor'
import { localContentHash } from '@/lib/import/wp-client'

export const dynamic = 'force-dynamic'

/**
 * API Endpoint: POST /api/import/repair
 * Memeriksa seluruh snapshot WordPress yang sudah tersimpan di basis data lokal,
 * mendeteksi artikel yang data metadata SEO Yoast/target kata kuncinya belum terisi (missing),
 * dan memperbaikinya secara instan tanpa perlu mengunduh ulang gambar dari internet.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const site = await getSiteProfile()
    const snapshots = await prisma.orm.public.WordPressSnapshot.where({ entityType: 'posts' }).all()

    let repaired = 0
    let alreadyComplete = 0
    let missingTarget = 0
    const details: Array<{ id: number; slug: string; focusKeyphrase?: string | null }> = []

    for (const snap of snapshots) {
      if (!snap.targetId) {
        missingTarget++
        continue
      }

      const article = await prisma.orm.public.Article.where({ id: snap.targetId }).first()
      if (!article) {
        missingTarget++
        continue
      }

      // Check if missing focus keyphrase, related keyphrases, or detailed seoData
      const hasMissingKeyphrase = !article.focusKeyphrase
      const hasMissingSeoData = !article.seoData
      const hasMissingMetaTitle = !article.metaTitle
      const hasMissingCanonical = !article.canonicalUrl

      if (hasMissingKeyphrase || hasMissingSeoData || hasMissingMetaTitle || hasMissingCanonical) {
        try {
          const raw = JSON.parse(snap.payload)
          const seo = extractWordPressSeo(
            raw,
            article.title,
            article.excerpt || '',
            article.coverUrl || article.featuredImage,
            site.url
          )

          const updateData: Record<string, any> = {
            metaTitle: article.metaTitle || seo.metaTitle,
            metaDescription: article.metaDescription || seo.metaDescription,
            canonicalUrl: article.canonicalUrl || seo.canonicalUrl,
            seoData: seo.seoData,
            isCornerstone: article.isCornerstone || seo.isCornerstone,
            ...(seo.focusKeyphrase && !article.focusKeyphrase ? { focusKeyphrase: seo.focusKeyphrase } : {}),
            ...(seo.relatedKeyphrases?.length && (!article.relatedKeyphrases || article.relatedKeyphrases === '[]')
              ? { relatedKeyphrases: JSON.stringify(seo.relatedKeyphrases) }
              : {}),
          }

          const updated = await prisma.orm.public.Article.where({ id: article.id }).update(updateData)
          if (updated) {
            await prisma.orm.public.WordPressSnapshot.where({ id: snap.id }).update({
              localHash: localContentHash(updated),
              status: 'imported',
              error: null,
            })
            repaired++
            details.push({
              id: article.id,
              slug: article.slug,
              focusKeyphrase: updated.focusKeyphrase,
            })
          }
        } catch (e: any) {
          console.warn(`[repair] Gagal memperbaiki snapshot ID ${snap.id}:`, e?.message)
        }
      } else {
        alreadyComplete++
      }
    }

    return NextResponse.json({
      success: true,
      message: repaired > 0
        ? `Sukses memperbaiki ${repaired} artikel! Metadata Yoast SEO dan kata kunci target telah ditempatkan dengan benar.`
        : 'Seluruh artikel sudah memiliki metadata lengkap. Tidak ada data missing.',
      stats: {
        totalSnapshots: snapshots.length,
        repaired,
        alreadyComplete,
        missingTarget,
      },
      repairedArticles: details.slice(0, 50),
    })
  } catch (error: any) {
    console.error('[WP Repair Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal menjalankan pemulihan data missing.' },
      { status: 500 }
    )
  }
}
