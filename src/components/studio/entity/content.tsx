'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { isServiceVisual, type ServiceVisual } from '@/lib/content/spatium-types'
import { FOCUS_RING, FieldError, FieldHelp, inputClass } from '../blocks/ui'
import { StatusBadge } from '../pages/shared'
import { ChipsField, CheckboxField, CoverField, LABEL_CLASS, Section, SelectField, StringListField, TextAreaField, TextField } from './fields'
import {
  fieldDomId,
  liveUrlStatus,
  type CategoryForm,
  type EntityRow,
  type FieldErrors,
  type PortfolioForm,
  type ServiceForm,
} from './model'

/** Lists the editor needs besides the entity itself (loaded by the manager). */
export type EditorContext = {
  categories: readonly EntityRow[]
  services: readonly EntityRow[]
  portfolios: readonly EntityRow[]
}

type PanelProps<F> = {
  form: F
  stored: EntityRow
  onPatch: (patch: Partial<F>) => void
  errors: FieldErrors
  context: EditorContext
}

const host = siteConfig.url.replace(/^https?:\/\//, '')

const VISUAL_LABEL: Record<ServiceVisual, string> = {
  filmmaking: 'Filmmaking & VFX',
  marketing: 'Marketing & Branding',
  entertainment: 'Entertainment & Installation',
  memory: 'Memory & Documentary',
  '2d': '2D',
  '3d': '3D',
  motion: 'Motion',
  assets: 'Aset digital',
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function SlugNote({ stored, slug }: { stored: EntityRow; slug: string }) {
  const live = stored.status === 'published' && slug.trim() !== stored.slug
  return live ? (
    <span className="mt-1 block text-amber-200">Sudah terbit: alamat lama akan dialihkan (301) ke slug baru saat disimpan.</span>
  ) : null
}

/* ----------------------------- Kategori layanan ---------------------------- */

export function CategoryContent({ form, stored, onPatch, errors, context }: PanelProps<CategoryForm>) {
  const children = context.services.filter((s) => s.categoryId === stored.id)
  return (
    <div className="space-y-4">
      <Section id="identity" title="Identitas" description="Tampil di hero halaman kategori dan di menu layanan.">
        <TextField field="title" label="Judul" required value={form.title} onChange={(title) => onPatch({ title })} errors={errors} maxLength={200} />
        <TextField
          field="slug"
          label="Slug"
          required
          mono
          prefix="/services/"
          value={form.slug}
          onChange={(slug) => onPatch({ slug })}
          errors={errors}
          help={
            <>
              Alamat publik: <span className="font-mono [overflow-wrap:anywhere]">{host}/services/{form.slug || '…'}</span>
              <SlugNote stored={stored} slug={form.slug} />
            </>
          }
        />
        <TextField field="tag" label="Tagline" value={form.tag} onChange={(tag) => onPatch({ tag })} errors={errors} maxLength={200} help="Satu kalimat di bawah judul hero. Kosong = tidak ditampilkan." />
        <TextAreaField
          field="shortDescription"
          label="Ringkasan"
          value={form.shortDescription}
          onChange={(shortDescription) => onPatch({ shortDescription })}
          errors={errors}
          maxLength={1000}
          help="Paragraf hero dan kartu kategori. Juga dipakai sebagai pengantar bila blok pengantar tidak punya paragraf sendiri."
        />
      </Section>

      <Section id="display" title="Tampilan">
        <SelectField
          field="themePreset"
          label="Ilustrasi"
          value={isServiceVisual(form.themePreset) ? form.themePreset : ''}
          onChange={(themePreset) => onPatch({ themePreset })}
          errors={errors}
          options={[{ value: '', label: 'Bawaan (Marketing & Branding)' }, ...(Object.keys(VISUAL_LABEL) as ServiceVisual[]).map((v) => ({ value: v, label: VISUAL_LABEL[v] }))]}
          help="Visual yang tampil di blok pengantar dan halaman layanan turunan."
        />
        <TextField
          field="order"
          label="Urutan"
          inputMode="numeric"
          value={form.order}
          onChange={(order) => onPatch({ order })}
          errors={errors}
          placeholder="Kosong = posisi di daftar"
          help="Angka kecil tampil lebih dulu. Juga menjadi nomor use case di hero."
        />
        <CheckboxField field="showInNav" label="Tampilkan di menu header" checked={form.showInNav} onChange={(showInNav) => onPatch({ showInNav })} help="Hanya kategori yang terbit yang muncul di menu." />
      </Section>

      <Section id="cover" title="Gambar sampul" description="Dipakai di menu header dan kartu kategori.">
        <CoverField image={form.heroImage} alt={form.coverAlt} onImageChange={(heroImage) => onPatch({ heroImage })} onAltChange={(coverAlt) => onPatch({ coverAlt })} errors={errors} />
      </Section>

      <Section id="outcomes" title="Keluaran & alat" description="Hanya hasil dan alat yang benar-benar dipakai. Kosong = bagian tidak tampil.">
        <StringListField field="deliverables" legend="Keluaran" itemLabel="Keluaran" items={form.deliverables} onChange={(deliverables) => onPatch({ deliverables })} errors={errors} help="Tampil di blok “Keluaran” beserta alur kerja." />
        <StringListField field="tools" legend="Alat" itemLabel="Alat" items={form.tools} onChange={(tools) => onPatch({ tools })} errors={errors} help="Pill di hero dan blok pengantar." />
      </Section>

      <Section id="children" title="Layanan turunan" description="Kartu di blok kapabilitas; hanya layanan yang terbit tampil di situs. Kelola di tab Layanan.">
        {children.length === 0 ? (
          <p className="text-sm text-neutral-300">Belum ada layanan di kategori ini.</p>
        ) : (
          <ul className="space-y-2">
            {children.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/10 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-white [overflow-wrap:anywhere]">{str(s.name)}</span>
                <StatusBadge status={str(s.status)} />
                <a href={`/admin?tab=services&type=service&id=${s.id}`} className={`rounded text-sm text-accent-300 underline underline-offset-2 hover:text-accent-200 ${FOCUS_RING}`}>
                  Edit<span className="sr-only"> layanan {str(s.name)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

/* --------------------------------- Layanan --------------------------------- */

export function ServiceContent({ form, stored, onPatch, errors, context }: PanelProps<ServiceForm>) {
  const parent = context.categories.find((c) => c.id === form.categoryId)
  const parentSlug = parent?.slug ?? null
  const portfolioError = errors.portfolioIds
  return (
    <div className="space-y-4">
      <Section id="identity" title="Identitas">
        <TextField field="name" label="Nama" required value={form.name} onChange={(name) => onPatch({ name })} errors={errors} maxLength={200} />
        <SelectField
          field="categoryId"
          label="Kategori induk"
          required
          value={form.categoryId === null ? '' : String(form.categoryId)}
          onChange={(v) => onPatch({ categoryId: v ? Number(v) : null })}
          errors={errors}
          options={[{ value: '', label: 'Pilih kategori…' }, ...context.categories.map((c) => ({ value: String(c.id), label: str(c.title) || c.slug }))]}
          help="Halaman layanan tayang di bawah kategorinya dan hanya terbit bila kategorinya terbit."
        />
        <TextField
          field="slug"
          label="Slug"
          required
          mono
          prefix={`/services/${parentSlug ?? '…'}/`}
          value={form.slug}
          onChange={(slug) => onPatch({ slug })}
          errors={errors}
          help={
            <>
              Alamat publik:{' '}
              <span className="font-mono [overflow-wrap:anywhere]">{parentSlug ? `${host}/services/${parentSlug}/${form.slug || '…'}` : 'pilih kategori induk dulu'}</span>
              <SlugNote stored={stored} slug={form.slug} />
            </>
          }
        />
        <TextAreaField
          field="shortDescription"
          label="Deskripsi singkat"
          value={form.shortDescription}
          onChange={(shortDescription) => onPatch({ shortDescription })}
          errors={errors}
          maxLength={1000}
          help="Ringkasan di hero dan kartu kapabilitas kategori."
        />
        <TextAreaField
          field="longDescription"
          label="Deskripsi lengkap"
          rows={6}
          value={form.longDescription}
          onChange={(longDescription) => onPatch({ longDescription })}
          errors={errors}
          maxLength={20000}
          placeholder={form.shortDescription ? `Kosong = memakai deskripsi singkat` : undefined}
          help="Blok deskripsi: satu paragraf per baris."
        />
      </Section>

      <Section id="display" title="Tampilan">
        <TextField
          field="order"
          label="Urutan"
          inputMode="numeric"
          value={form.order}
          onChange={(order) => onPatch({ order })}
          errors={errors}
          help="Angka kecil tampil lebih dulu di kategori."
        />
        <TextField
          field="indexNumber"
          label="Nomor tampilan"
          value={form.indexNumber}
          onChange={(indexNumber) => onPatch({ indexNumber })}
          errors={errors}
          maxLength={20}
          placeholder={form.order.trim() ? `Kosong = ${form.order.trim().padStart(2, '0')}` : 'Kosong = dari urutan'}
          help="Nomor kecil di hero, mis. 01."
        />
        <CheckboxField field="featured" label="Unggulan" checked={form.featured} onChange={(featured) => onPatch({ featured })} help="Menandai layanan ini untuk daftar pilihan unggulan." />
      </Section>

      <Section id="outcomes" title="Keluaran & teknologi" description="Hanya yang benar-benar dipakai. Kosong = bagian tidak tampil.">
        <StringListField field="deliverables" legend="Keluaran" itemLabel="Keluaran" items={form.deliverables} onChange={(deliverables) => onPatch({ deliverables })} errors={errors} help="Blok “Keluaran” layanan." />
        <ChipsField field="technologies" legend="Teknologi" items={form.technologies} onChange={(technologies) => onPatch({ technologies })} help="Pill di hero layanan. Tekan Enter untuk menambah." />
      </Section>

      <Section id="related" title="Portofolio terkait" description="Tampil di blok karya terkait; hanya portofolio yang terbit muncul di situs.">
        {context.portfolios.length === 0 ? (
          <p className="text-sm text-neutral-300">Belum ada portofolio.</p>
        ) : (
          <fieldset className="min-w-0" aria-describedby={portfolioError ? `${fieldDomId('portfolioIds')}-error` : undefined}>
            <legend className="sr-only">Portofolio terkait</legend>
            <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {context.portfolios.map((p, i) => {
                const id = i === 0 ? fieldDomId('portfolioIds') : `${fieldDomId('portfolioIds')}-${p.id}`
                const checked = form.portfolioIds.includes(p.id)
                return (
                  <li key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        onPatch({ portfolioIds: e.target.checked ? [...form.portfolioIds, p.id] : form.portfolioIds.filter((x) => x !== p.id) })
                      }
                      className="h-5 w-5 shrink-0 accent-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                    />
                    <label htmlFor={id} className="min-w-0 flex-1 text-sm text-neutral-100 [overflow-wrap:anywhere]">
                      {str(p.title) || p.slug}
                    </label>
                    <StatusBadge status={str(p.status)} />
                  </li>
                )
              })}
            </ul>
            <FieldError id={`${fieldDomId('portfolioIds')}-error`} messages={portfolioError ? [portfolioError] : undefined} />
          </fieldset>
        )}
      </Section>

      <Section id="cover" title="Gambar sampul" description="Gambar utama layanan (bila dipakai blok dan berbagi).">
        <CoverField image={form.heroImage} alt={form.coverAlt} onImageChange={(heroImage) => onPatch({ heroImage })} onAltChange={(coverAlt) => onPatch({ coverAlt })} errors={errors} />
      </Section>
    </div>
  )
}

/* -------------------------------- Portofolio ------------------------------- */

function LiveUrlState({ url }: { url: string }) {
  const status = liveUrlStatus(url)
  const id = `${fieldDomId('liveUrl')}-state`
  switch (status.kind) {
    case 'empty':
      return <FieldHelp id={id}>Kosong = blok scene menampilkan gambar sampul sebagai poster.</FieldHelp>
    case 'superSplat':
      return <FieldHelp id={id}>Scene SuperSplat <span className="font-mono">{status.sceneId}</span> disematkan di blok scene.</FieldHelp>
    case 'embed':
      return <FieldHelp id={id}>Disematkan dari {status.domain}.</FieldHelp>
    case 'local':
      return (
        <p id={id} className="mt-1.5 text-xs leading-relaxed text-amber-200">
          Tur lokal tidak disematkan di blok scene (hanya SuperSplat dan domain yang diizinkan); blok menampilkan poster.
        </p>
      )
    case 'invalid':
      return null
  }
}

export function PortfolioContent({ form, stored, onPatch, errors, context }: PanelProps<PortfolioForm>) {
  const categories = [...new Set(context.portfolios.map((p) => str(p.category)).filter(Boolean))].sort()
  const live = liveUrlStatus(form.liveUrl)
  const liveId = fieldDomId('liveUrl')
  return (
    <div className="space-y-4">
      <Section id="identity" title="Identitas">
        <TextField field="title" label="Judul" required value={form.title} onChange={(title) => onPatch({ title })} errors={errors} maxLength={200} />
        <TextField
          field="slug"
          label="Slug"
          required
          mono
          prefix="/portfolio/"
          value={form.slug}
          onChange={(slug) => onPatch({ slug })}
          errors={errors}
          help={
            <>
              Alamat publik: <span className="font-mono [overflow-wrap:anywhere]">{host}/portfolio/{form.slug || '…'}</span>
              <SlugNote stored={stored} slug={form.slug} />
            </>
          }
        />
        <TextField field="category" label="Kategori" list="entity-portfolio-categories" value={form.category} onChange={(category) => onPatch({ category })} errors={errors} maxLength={100} help="Sektor di pill hero. Pilih yang sudah ada atau ketik baru." />
        <datalist id="entity-portfolio-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField field="client" label="Klien (opsional)" value={form.client} onChange={(client) => onPatch({ client })} errors={errors} maxLength={200} help="Hanya bila klien setuju disebut." />
          <TextField field="year" label="Tahun (opsional)" inputMode="numeric" value={form.year} onChange={(year) => onPatch({ year })} errors={errors} maxLength={4} />
        </div>
      </Section>

      <Section id="summary" title="Ringkasan">
        <TextAreaField field="summary" label="Ringkasan" value={form.summary} onChange={(summary) => onPatch({ summary })} errors={errors} maxLength={2000} help="Tagline di hero dan kartu portofolio." />
      </Section>

      <Section id="scene" title="Scene 3D" description="Viewer di blok scene dan data terukur di kartu detail. Isi hanya angka yang benar-benar diukur.">
        <div>
          <label htmlFor={liveId} className={LABEL_CLASS}>
            URL scene
          </label>
          <input
            id={liveId}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://superspl.at/s?id=…"
            value={form.liveUrl}
            aria-invalid={errors.liveUrl ? true : undefined}
            aria-describedby={[errors.liveUrl ? `${liveId}-error` : '', live.kind !== 'invalid' ? `${liveId}-state` : ''].filter(Boolean).join(' ') || undefined}
            onChange={(e) => onPatch({ liveUrl: e.target.value })}
            className={inputClass(Boolean(errors.liveUrl), 'h-10 font-mono')}
          />
          <FieldError id={`${liveId}-error`} messages={errors.liveUrl ? [errors.liveUrl] : undefined} />
          <LiveUrlState url={form.liveUrl} />
          {live.kind === 'superSplat' || live.kind === 'embed' ? (
            <a href={form.liveUrl.trim()} target="_blank" rel="noopener noreferrer" className={`mt-1 inline-flex items-center gap-1 rounded text-xs text-accent-300 underline underline-offset-2 ${FOCUS_RING}`}>
              Buka scene<span className="sr-only"> (tab baru)</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField field="pointCount" label="Jumlah titik" value={form.pointCount} onChange={(pointCount) => onPatch({ pointCount })} errors={errors} maxLength={60} help="Mis. 15,1 juta splat." />
          <TextField field="accuracy" label="Akurasi" value={form.accuracy} onChange={(accuracy) => onPatch({ accuracy })} errors={errors} maxLength={60} help="Mis. ±5 mm." />
          <TextField field="location" label="Lokasi" value={form.location} onChange={(location) => onPatch({ location })} errors={errors} maxLength={120} />
        </div>
      </Section>

      <Section id="cover" title="Gambar sampul" description="Poster scene, kartu portofolio, dan gambar berbagi.">
        <CoverField image={form.heroImage} alt={form.coverAlt} onImageChange={(heroImage) => onPatch({ heroImage })} onAltChange={(coverAlt) => onPatch({ coverAlt })} errors={errors} />
      </Section>

      <Section id="story" title="Narasi" description="Blok brief: tantangan, langkah, dan hasil.">
        <TextAreaField field="challenge" label="Tantangan" rows={4} value={form.challenge} onChange={(challenge) => onPatch({ challenge })} errors={errors} maxLength={20000} placeholder={form.summary ? 'Kosong = memakai ringkasan' : undefined} />
        <TextAreaField field="approach" label="Langkah capture" rows={5} value={form.approach} onChange={(approach) => onPatch({ approach })} errors={errors} maxLength={20000} help="Satu langkah per baris." />
        <TextAreaField field="result" label="Keluaran" rows={4} value={form.result} onChange={(result) => onPatch({ result })} errors={errors} maxLength={20000} help="Satu keluaran per baris." />
        <ChipsField
          field="technologies"
          legend="Teknologi"
          items={form.technologies}
          onChange={(technologies) => onPatch({ technologies })}
          help="Yang pertama tampil sebagai metode capture. Tekan Enter untuk menambah."
        />
      </Section>

      <Section id="display" title="Tampilan">
        <CheckboxField field="featured" label="Unggulan" checked={form.featured} onChange={(featured) => onPatch({ featured })} help="Menandai portofolio ini untuk daftar pilihan unggulan." />
      </Section>
    </div>
  )
}

