import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { actorOf, recordCatalogHistory } from '@/lib/db/catalogMutations'

export const maxDuration = 60

/** Upper bound for a spatial tour bundle (.zip / .html). */
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined))

const uploadFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Judul proyek tur spasial wajib diisi.').max(200),
  slug: optionalText(200),
  client: optionalText(200),
  category: optionalText(100),
  summary: optionalText(2000),
  // Specs are stored only when the editor supplies measured values — never defaulted.
  pointCount: optionalText(60),
  accuracy: optionalText(60),
  splatId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{1,64}$/, 'ID SuperSplat tidak valid.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  externalUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === '' || v.startsWith('https://') || v.startsWith('/tours/'), {
      message: 'URL eksternal harus https:// atau /tours/...',
    })
    .optional()
    .transform((v) => (v ? v : undefined)),
})

function field(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === 'string' ? value : undefined
}

export async function POST(request: NextRequest) {
  // Trust boundary: only studio editors may write files under public/tours and create portfolio rows.
  // Same roles as portfolio:create / portfolio:update in the capability map.
  const auth = await requireCan(request, 'portfolio:create')
  if (auth.error) return auth.error

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    console.warn('[TourUpload] Invalid multipart body:', err)
    return NextResponse.json({ success: false, error: 'Body multipart tidak valid.' }, { status: 400 })
  }

  const parsed = uploadFieldsSchema.safeParse({
    title: field(formData, 'title') ?? '',
    slug: field(formData, 'slug'),
    client: field(formData, 'client'),
    category: field(formData, 'category'),
    summary: field(formData, 'summary'),
    pointCount: field(formData, 'pointCount'),
    accuracy: field(formData, 'accuracy'),
    splatId: field(formData, 'splatId'),
    externalUrl: field(formData, 'externalUrl'),
  })
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid.' },
      { status: 400 },
    )
  }
  const input = parsed.data
  const safeSlug = slugify(input.slug ?? input.title)
  if (!safeSlug) {
    return NextResponse.json({ success: false, error: 'Slug tidak valid.' }, { status: 400 })
  }
  const featured = formData.get('featured') === 'true' || formData.get('featured') === 'on'

  const fileEntry = formData.get('file')
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null
  if (file && file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran berkas melebihi batas 250 MB.' }, { status: 413 })
  }

  let liveUrl = input.externalUrl ?? ''
  const toursBaseDir = path.join(process.cwd(), 'public', 'tours')
  const targetDir = path.join(toursBaseDir, safeSlug)

  try {
    if (file) {
      const fileName = file.name.toLowerCase()
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      fs.mkdirSync(toursBaseDir, { recursive: true })

      if (fileName.endsWith('.zip')) {
        if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true })
        fs.mkdirSync(targetDir, { recursive: true })

        const root = path.resolve(targetDir)
        let entryPointHtmlRel = ''
        for (const entry of new AdmZip(fileBuffer).getEntries()) {
          const resolvedPath = path.resolve(targetDir, entry.entryName)
          // Zip Slip defence.
          if (!resolvedPath.startsWith(root + path.sep) && resolvedPath !== root) {
            console.warn(`[TourUpload] Suspicious zip entry rejected: ${entry.entryName}`)
            continue
          }
          if (entry.isDirectory) {
            fs.mkdirSync(resolvedPath, { recursive: true })
            continue
          }
          fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
          fs.writeFileSync(resolvedPath, entry.getData())
          const base = path.basename(resolvedPath).toLowerCase()
          if (!entryPointHtmlRel && base.endsWith('.html')) {
            entryPointHtmlRel = path.relative(targetDir, resolvedPath)
          }
          if (base === 'index.html' && path.dirname(resolvedPath) === root) {
            entryPointHtmlRel = 'index.html'
          }
        }

        if (!entryPointHtmlRel) {
          fs.rmSync(targetDir, { recursive: true, force: true })
          return NextResponse.json(
            { success: false, error: 'Arsip .zip tidak berisi berkas .html sebagai titik masuk tur.' },
            { status: 400 },
          )
        }
        liveUrl = `/tours/${safeSlug}/${entryPointHtmlRel.split(path.sep).join('/')}`
      } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(path.join(targetDir, 'index.html'), fileBuffer)
        liveUrl = `/tours/${safeSlug}/index.html`
      } else {
        return NextResponse.json(
          { success: false, error: 'Format berkas tidak didukung. Unggah arsip .zip atau .html.' },
          { status: 400 },
        )
      }
    }
  } catch (err) {
    console.error('[TourUpload] Failed to store tour bundle:', err)
    return NextResponse.json({ success: false, error: 'Gagal menyimpan berkas tur spasial.' }, { status: 500 })
  }

  if (!liveUrl && input.splatId) liveUrl = `https://superspl.at/s?id=${input.splatId}`
  if (!liveUrl) {
    return NextResponse.json(
      { success: false, error: 'Sertakan berkas tur, ID SuperSplat, atau URL eksternal.' },
      { status: 400 },
    )
  }

  const metrics = [
    input.pointCount ? { label: 'Point Count', value: input.pointCount } : null,
    input.accuracy ? { label: 'Spatial Accuracy', value: input.accuracy } : null,
  ].filter((m): m is { label: string; value: string } => m !== null)

  // Uploads land as DRAFT: publishing goes through the Studio publication gate (AGENTS.md §3.5).
  // Re-uploading to an existing slug only refreshes the tour link and the fields the
  // editor filled in, so an existing case study is never blanked or re-statused.
  const provided = {
    title: input.title,
    liveUrl,
    featured,
    ...(input.client ? { client: input.client } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(metrics.length > 0 ? { metrics: JSON.stringify(metrics) } : {}),
  }

  let savedStatus = 'draft'
  try {
    const actor = actorOf(auth.user)
    savedStatus = await prisma.transaction(async (tx) => {
      const existing = await tx.orm.public.Portfolio.where({ slug: safeSlug }).forUpdate().first()
      if (existing) {
        await tx.orm.public.Portfolio.where({ id: existing.id }).update(provided)
        await recordCatalogHistory(tx, 'portfolio', existing.id, actor, 'update:tour-upload', existing, {
          fields: Object.keys(provided),
        })
        return existing.status ?? 'draft'
      }
      const row = await tx.orm.public.Portfolio.create({
        client: null,
        category: null,
        summary: null,
        metrics: null,
        ...provided,
        technologies: JSON.stringify(['3D Gaussian Splatting']),
        documentId: `port-${safeSlug}`,
        slug: safeSlug,
        status: 'draft',
      })
      await recordCatalogHistory(tx, 'portfolio', row.id, actor, 'create:tour-upload', row)
      return 'draft'
    })
  } catch (err) {
    console.error('[TourUpload] Portfolio upsert failed:', err)
    return NextResponse.json(
      { success: false, error: 'Berkas tersimpan, tetapi gagal mendaftarkan portofolio ke database.' },
      { status: 500 },
    )
  }

  await revalidateCatalog('portfolio', safeSlug)

  return NextResponse.json({
    success: true,
    message:
      savedStatus === 'draft'
        ? 'Tur spasial tersimpan sebagai draft. Tinjau lalu publikasikan dari Portfolio Manager.'
        : `Tur spasial diperbarui pada portofolio "${safeSlug}" (status: ${savedStatus}).`,
    slug: safeSlug,
    liveUrl,
    portfolio: { slug: safeSlug, title: input.title, status: savedStatus, liveUrl },
  })
}
