import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { getServiceCategoryBySlug } from '@/lib/db/serviceCategories'
import { getServiceBySlug } from '@/lib/db/services'
import { getSolutionBySlug } from '@/lib/db/solutions'
import { getPortfolioBySlug } from '@/lib/db/portfolio'
import StudioLivePreview from '@/components/studio/StudioLivePreview'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preview — SegiaTech Studio',
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
    redirect(`${siteConfig.url}/artikel/${encodeURIComponent(decodedId)}?preview=true`)
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
        <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display">Entitas Pratinjau Tidak Ditemukan</h2>
          <p className="text-xs text-neutral-400 font-mono">
            Tipe: <span className="text-[#F2C7A0]">{type}</span> • ID: <span className="text-[#F2C7A0]">{decodedId}</span>
          </p>
          <p className="text-xs text-neutral-500">
            Pastikan entitas telah disimpan ke database sebelum memuat pratinjau server.
          </p>
        </div>
      </div>
    )
  }

  const blocks = Array.isArray(entity.blocks) ? entity.blocks : []

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <StudioLivePreview
        blocks={blocks}
        contextData={contextData}
        title={entityTitle}
        slug={decodedId}
        targetType={type === 'category' ? 'department' : (type as any)}
      />
    </div>
  )
}
