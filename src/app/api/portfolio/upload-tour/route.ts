import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'

// Maximum upload size: 250MB for spatial tour bundles
export const maxDuration = 60

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = (formData.get('title') as string | null)?.trim()
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Judul proyek tur spasial wajib diisi.' },
        { status: 400 }
      )
    }

    const rawSlug = (formData.get('slug') as string | null)?.trim()
    const safeSlug = rawSlug ? slugify(rawSlug) : slugify(title)
    if (!safeSlug) {
      return NextResponse.json(
        { success: false, error: 'Slug tidak valid.' },
        { status: 400 }
      )
    }

    const client = (formData.get('client') as string | null)?.trim() || 'Klien Spatium'
    const category = (formData.get('category') as string | null)?.trim() || 'Marketing & Branding'
    const summary = (formData.get('summary') as string | null)?.trim() || `${title} — Tur spasial interaktif 3D Gaussian Splatting.`
    const pointCount = (formData.get('pointCount') as string | null)?.trim() || '12.0M Splats'
    const accuracy = (formData.get('accuracy') as string | null)?.trim() || 'Sub-centimeter (5mm)'
    const splatId = (formData.get('splatId') as string | null)?.trim() || ''
    const externalUrl = (formData.get('externalUrl') as string | null)?.trim() || ''
    const featured = formData.get('featured') === 'true' || formData.get('featured') === 'on'

    const file = formData.get('file') as File | null
    let liveUrl = externalUrl

    const toursBaseDir = path.join(process.cwd(), 'public', 'tours')
    const targetDir = path.join(toursBaseDir, safeSlug)

    // Ensure base directory exists
    if (!fs.existsSync(toursBaseDir)) {
      fs.mkdirSync(toursBaseDir, { recursive: true })
    }

    if (file && file.size > 0) {
      const fileName = file.name.toLowerCase()
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      if (fileName.endsWith('.zip')) {
        // Safe ZIP extraction with Zip Slip defense
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true })
        }
        fs.mkdirSync(targetDir, { recursive: true })

        const zip = new AdmZip(fileBuffer)
        const zipEntries = zip.getEntries()

        let entryPointHtmlRel = ''

        for (const entry of zipEntries) {
          const entryPath = entry.entryName
          // Defend against Zip Slip
          const resolvedPath = path.resolve(targetDir, entryPath)
          if (!resolvedPath.startsWith(path.resolve(targetDir) + path.sep) && resolvedPath !== path.resolve(targetDir)) {
            console.warn(`[TourUpload] Suspicious zip entry rejected: ${entryPath}`)
            continue
          }

          if (entry.isDirectory) {
            fs.mkdirSync(resolvedPath, { recursive: true })
          } else {
            const entryDir = path.dirname(resolvedPath)
            if (!fs.existsSync(entryDir)) {
              fs.mkdirSync(entryDir, { recursive: true })
            }
            fs.writeFileSync(resolvedPath, entry.getData())

            // Detect main index.html or root html file
            const lowerBase = path.basename(resolvedPath).toLowerCase()
            if (lowerBase === 'index.html' && !entryPointHtmlRel) {
              entryPointHtmlRel = path.relative(targetDir, resolvedPath)
            } else if (lowerBase.endsWith('.html') && !entryPointHtmlRel) {
              entryPointHtmlRel = path.relative(targetDir, resolvedPath)
            }
          }
        }

        if (!entryPointHtmlRel) {
          entryPointHtmlRel = 'index.html'
          // If no html found, create a starter player wrapper
          const fallbackHtmlPath = path.join(targetDir, 'index.html')
          if (!fs.existsSync(fallbackHtmlPath)) {
            fs.writeFileSync(
              fallbackHtmlPath,
              `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — SPATIUM Tour</title>
  <style>
    body { margin: 0; background: #0F3A79; color: #FFFFFF; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    h1 { color: #FFD600; font-size: 1.8rem; margin-bottom: 0.5rem; }
    p { color: #E2E8F0; max-width: 500px; line-height: 1.5; }
  </style>
</head>
<body>
  <div>
    <h1>${title}</h1>
    <p>Tur spasial berhasil diekstrak dan siap dikonfigurasi.</p>
  </div>
</body>
</html>`
            )
          }
        }

        // Normalize forward slashes for URL
        const normalizedRel = entryPointHtmlRel.split(path.sep).join('/')
        liveUrl = `/tours/${safeSlug}/${normalizedRel}`
      } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        // Single HTML file upload
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        const destPath = path.join(targetDir, 'index.html')
        fs.writeFileSync(destPath, fileBuffer)
        liveUrl = `/tours/${safeSlug}/index.html`
      } else {
        return NextResponse.json(
          { success: false, error: 'Format berkas tidak didukung. Harap unggah berkas arsip .zip atau .html.' },
          { status: 400 }
        )
      }
    }

    if (!liveUrl) {
      if (splatId) {
        liveUrl = `https://superspl.at/s?id=${splatId}`
      } else {
        liveUrl = `/tours/${safeSlug}/index.html`
      }
    }

    const technologies = ['3D Gaussian Splatting', 'WebGL Tour Engine', 'LiDAR Scanning']
    const metrics = [
      { label: 'Point Count', value: pointCount },
      { label: 'Spatial Accuracy', value: accuracy },
      { label: 'WebGL Engine', value: '60 FPS Real-time' },
    ]

    const newPortfolioItem = {
      id: Date.now(),
      documentId: `port-${safeSlug}`,
      title,
      slug: safeSlug,
      client,
      year: new Date().getFullYear(),
      category,
      discipline: `${category} · 3D Gaussian Splatting`,
      summary,
      challenge: 'Membutuhkan dokumentasi spasial interaktif fidelitas tinggi yang dapat diakses secara instan dari web.',
      approach: 'Pemindaian spasial LiDAR dan fotogrametri berkerapatan tinggi yang dikonversi menjadi medan radiansi neural 3DGS.',
      solution: 'Penyajian tur spasial WebGL 60 FPS mandiri dengan navigasi kamera bebas dan akurasi sub-sentimeter.',
      result: 'Memberikan pengalaman verifikasi visual 1:1 tanpa batasan jarak fisik.',
      heroImage: `/images/spatium/page_01_0.jpg`,
      liveUrl,
      featured,
      status: 'published',
      technologies,
      metrics,
    }

    // 1. Persist to seed_portfolio.json
    try {
      const seedFile = path.join(process.cwd(), 'src', 'data', 'seed', 'seed_portfolio.json')
      if (fs.existsSync(seedFile)) {
        const raw = fs.readFileSync(seedFile, 'utf-8')
        const items = JSON.parse(raw)
        const existingIdx = items.findIndex((item: any) => item.slug === safeSlug)
        if (existingIdx >= 0) {
          items[existingIdx] = { ...items[existingIdx], ...newPortfolioItem, id: items[existingIdx].id }
        } else {
          items.unshift(newPortfolioItem)
        }
        fs.writeFileSync(seedFile, JSON.stringify(items, null, 2), 'utf-8')
      }
    } catch (persistErr) {
      console.warn('[TourUpload] Failed to update seed_portfolio.json:', persistErr)
    }

    // 2. Try DB Upsert via Prisma if DB is available
    try {
      await prisma.orm.public.Portfolio.upsert({
        conflictOn: { slug: safeSlug },
        update: {
          title,
          client,
          category,
          summary,
          liveUrl,
          featured,
          status: 'published',
          technologies: JSON.stringify(technologies),
          metrics: JSON.stringify(metrics),
        },
        create: {
          documentId: `port-${safeSlug}`,
          slug: safeSlug,
          title,
          client,
          year: new Date().getFullYear(),
          category,
          summary,
          liveUrl,
          heroImage: `/images/spatium/page_01_0.jpg`,
          featured,
          status: 'published',
          technologies: JSON.stringify(technologies),
          metrics: JSON.stringify(metrics),
        },
      })
    } catch (dbErr) {
      console.warn('[TourUpload] DB upsert bypassed (offline mode active):', (dbErr as any)?.message)
    }

    revalidatePath('/portfolio')
    revalidatePath(`/portfolio/${safeSlug}`)
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: 'Tur spasial berhasil diunggah dan didaftarkan ke portofolio SPATIUM.',
      slug: safeSlug,
      liveUrl,
      portfolio: newPortfolioItem,
    })
  } catch (err: any) {
    console.error('[TourUpload] Error processing tour upload:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Terjadi kesalahan saat memproses berkas tur spasial.' },
      { status: 500 }
    )
  }
}
