'use client'

import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { PublicationGateResult } from '@/lib/blocks/publication-gate'
import { Button } from '../blocks/ui'
import { Section, TextAreaField, TextField } from './fields'
import { gateIssueTarget, gateIssueText, titleOf, type EntityForm, type FieldErrors, type IssueTarget } from './model'

type Props = {
  form: EntityForm
  gate: PublicationGateResult
  errors: FieldErrors
  onPatch: (patch: Partial<EntityForm>) => void
  onFix: (target: IssueTarget) => void
}

/** Publication checklist (same gate the API runs) + meta fields. */
export function SeoPanel({ form, gate, errors, onPatch, onFix }: Props) {
  const title = titleOf(form)
  const summary = form.kind === 'portfolio' ? form.summary : form.shortDescription
  const count = gate.issues.length
  return (
    <div className="space-y-4">
      <section aria-labelledby="entity-gate-heading" className="rounded-xl border border-white/10 bg-surface-elevated p-3 sm:p-4">
        <h3 id="entity-gate-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
          {count === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-amber-300" aria-hidden="true" />}
          {count === 0 ? 'Siap diterbitkan' : `Syarat publikasi: ${count} belum terpenuhi`}
        </h3>
        {count > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {gate.issues.map((issue) => {
              const target = gateIssueTarget(form.kind, issue)
              return (
                <li key={issue} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-100">
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{gateIssueText(form.kind, issue)}</span>
                  {target ? (
                    <Button size="sm" variant="ghost" onClick={() => onFix(target)}>
                      {target.kind === 'blocks' ? 'Buka blok' : 'Perbaiki'}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-neutral-300">Judul, slug, meta, teks alternatif, dan blok sudah memenuhi syarat.</p>
        )}
        {gate.warnings.length ? (
          <ul className="mt-2 space-y-1 text-xs text-amber-100">
            {gate.warnings.map((w) => (
              <li key={w} className="flex items-start gap-1.5">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Section id="search" title="Hasil pencarian" description="Wajib untuk terbit. Kosong = judul dan ringkasan dipakai sebagai cadangan, tetapi gerbang publikasi tetap memintanya.">
        <TextField
          field="metaTitle"
          label="Meta title"
          value={form.metaTitle}
          onChange={(metaTitle) => onPatch({ metaTitle })}
          errors={errors}
          maxLength={120}
          placeholder={title ? `Kosong = ${title}` : undefined}
          counter={{ min: 10, ideal: 60, max: 70 }}
        />
        <TextAreaField
          field="metaDescription"
          label="Meta description"
          value={form.metaDescription}
          onChange={(metaDescription) => onPatch({ metaDescription })}
          errors={errors}
          maxLength={320}
          placeholder={summary ? `Kosong = ${summary.slice(0, 120)}` : undefined}
          counter={{ min: 20, ideal: 155, max: 165 }}
        />
        <TextField
          field="focusKeyphrase"
          label="Frasa kunci utama"
          value={form.focusKeyphrase}
          onChange={(focusKeyphrase) => onPatch({ focusKeyphrase })}
          errors={errors}
          maxLength={200}
          help="Frasa yang ingin Anda menangkan di pencarian. Hanya untuk perencanaan; tidak tampil di halaman."
        />
      </Section>

      <Section id="share" title="Berbagi">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
            {form.heroImage ? (
              // Plain <img>: thumbnail of an arbitrary URL; decorative (its alt text is edited in the Konten tab).
              <img src={form.heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-neutral-300">Gambar bawaan situs</span>
            )}
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2 text-sm text-neutral-200">
            <p>Gambar sampul dipakai saat halaman dibagikan.</p>
            <Button size="sm" onClick={() => onFix({ kind: 'field', field: 'heroImage' })}>
              Ubah di tab Konten
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
