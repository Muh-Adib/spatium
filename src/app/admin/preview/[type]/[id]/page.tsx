import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { getServiceCategoryBySlug } from '@/lib/db/serviceCategories'
import { getServiceBySlug } from '@/lib/db/services'
import { getSolutionBySlug } from '@/lib/db/solutions'
import { getPortfolioBySlug } from '@/lib/db/portfolio'
import StudioLivePreview from '@/components/studio/StudioLivePreview'
import { DynamicPageView } from '@/components/blocks/DynamicPageView'
import { getPageById } from '@/lib/pages/repository'
import { pageIdSchema } from '@/lib/pages/http'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preview — SPATIUM Studio',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{
    type: string
    id: string
  }>
}

export default async function AdminEntityPreviewPage({ params }: Props) {
  const { type, id } = await params
  const decodedId = decodeURIComponent(id)

  if (type === 'article') {
    redirect(`${siteConfig.url}/journal/${encodeURIComponent(decodedId)}`)
  }

  // Dynamic pages: render the saved version (any status) exactly like `/<slug>`.
  if (type === 'page') {
    const pageId = pageIdSchema.safeParse(decodedId)
    const page = pageId.success ? await getPageById(pageId.data) : null
    if (!page) notFound()
    return (
      <>
        <p role="status" className="sticky top-0 z-50 border-b border-amber-400/40 bg-[#1a1405] px-4 py-2 text-center text-sm text-amber-100">
          Pratinjau versi tersimpan · status: {page.status} · alamat publik: /{page.slug}
          {page.status === 'published' ? '' : ' (belum tampil di situs)'}
        </p>
        <main id="main">
          <DynamicPageView title={page.title} slug={page.slug} blocks={page.blocks} />
        </main>
      </>
    )
  }

  let entity: any = null
  let contextData: any = {}
  let entityTitle = ''

  if (type === 'category' || type === 'department') {
    entity = await getServiceCategoryBySlug(decodedId)
    if (entity) {
      entityTitle = entity.title
      contextData = { subServices: entity.services || [] }
    }
  } else if (type === 'service') {
    entity = await getServiceBySlug(decodedId)
    if (entity) {
      entityTitle = entity.name
      contextData = { portfolios: entity.portfolioItems || [] }
    }
  } else if (type === 'solution') {
    entity = await getSolutionBySlug(decodedId)
    if (entity) {
      entityTitle = entity.title
      contextData = { portfolios: entity.relatedPortfolios || [] }
    }
  } else if (type === 'portfolio') {
    entity = await getPortfolioBySlug(decodedId)
    if (entity) {
      entityTitle = entity.title
    }
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--studio-bg)] border border-white/10 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display">Entitas Pratinjau Tidak Ditemukan</h2>
          <p className="text-xs text-neutral-400 font-mono">
            Tipe: <span className="text-[#4d8bff]">{type}</span> • ID: <span className="text-[#4d8bff]">{decodedId}</span>
          </p>
          <p className="text-xs text-neutral-500">
            Pastikan entitas telah disimpan ke database sebelum memuat pratinjau server.
          </p>
        </div>
      </div>
    )
  }

  const rawBlocks = entity.blocks
  let blocks: any[] = []
  if (Array.isArray(rawBlocks)) {
    blocks = rawBlocks
  } else if (typeof rawBlocks === 'string' && rawBlocks.trim().length > 0) {
    try {
      blocks = JSON.parse(rawBlocks)
    } catch {
      blocks = []
    }
  }

  const previewTargetType: 'department' | 'service' | 'portfolio' | 'solution' =
    type === 'category' ? 'department' :
    type === 'service' ? 'service' :
    type === 'portfolio' ? 'portfolio' :
    type === 'solution' ? 'solution' : 'department'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <StudioLivePreview
        blocks={blocks}
        contextData={contextData}
        title={entityTitle}
        slug={decodedId}
        targetType={previewTargetType}
      />
    </div>
  )
}
