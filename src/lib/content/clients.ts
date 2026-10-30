import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface ClientLogoItem {
  id: string
  name: string
  src: string
  alt: string
  imgClass?: string
}

/**
 * Retrieves client logos from PostgreSQL database via Prisma 8 (media_items or portfolios)
 * Enforces L8-T4: zero hardcoded client arrays in frontend code.
 */
export async function getClientLogos(): Promise<ClientLogoItem[]> {
  try {
    // 1. Query media_items marked for client slider
    const media = await prisma.orm.public.MediaItem.all()
    const clientMedia = media.filter((m: any) => m.usedIn === 'client_slider' || (m.url && m.url.startsWith('/logos/')))

    if (clientMedia && clientMedia.length > 0) {
      return clientMedia.map((m: any) => ({
        id: String(m.id),
        name: m.title || m.altText || 'Klien Institusi SegiaTech',
        src: m.url,
        alt: m.altText || m.title || 'Logo Klien',
      }))
    }

    // 2. Dynamic fallback: extract distinct verified clients from portfolios table
    const portfolioClients = await prisma.orm.public.Portfolio.all()
    const uniqueClients = Array.from(
      new Set(portfolioClients.map((p: any) => p.client).filter((c: any): c is string => Boolean(c) && c !== ''))
    )

    return (uniqueClients as string[]).map((clientName: string, index: number) => ({
      id: `client-${index + 1}`,
      name: clientName,
      src: `/logos/client-${(index % 9) + 1}.png`,
      alt: clientName,
    }))
  } catch (err) {
    console.error('Failed to get client logos from DB:', err)
    return []
  }
}
