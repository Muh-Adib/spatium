'use client'

import React, { useMemo, useState } from 'react'
import { Check, Copy, Search } from 'lucide-react'
import {
  BLOCK_CATALOG,
  BLOCK_CATEGORY_LABEL,
  blockJsonSchema,
  type BlockCatalogEntry,
  type BlockCategory,
  type BlockField,
  type BlockTarget,
} from '@/lib/blocks/catalog'
import { filterBlocks } from './blocks/model'
import { BlockPreview } from './blocks/BlockPreview'
import { CategoryIcon } from './blocks/icons'
import { Badge, Button, FOCUS_RING, inputClass } from './blocks/ui'

const TARGET_LABEL: Record<BlockTarget, string> = {
  page: 'Halaman',
  portfolio: 'Portofolio',
  service: 'Layanan',
  solution: 'Solusi',
}

const KIND_LABEL: Record<BlockField['kind'], string> = {
  text: 'Teks',
  textarea: 'Teks panjang',
  url: 'URL',
  number: 'Angka',
  boolean: 'Ya/tidak',
  select: 'Pilihan',
  image: 'Gambar + alt',
  link: 'Tautan (label + URL)',
  stringList: 'Daftar teks',
  list: 'Daftar item',
  table: 'Baris tabel',
}

function FieldRows({ fields, depth = 0 }: { fields: readonly BlockField[]; depth?: number }) {
  return (
    <>
      {fields.map((f) => (
        <React.Fragment key={`${depth}-${f.key}`}>
          <tr className="border-t border-white/10 align-top">
            <td className="py-2 pr-3 text-white" style={{ paddingInlineStart: `${depth * 1}rem` }}>
              {depth > 0 ? <span aria-hidden="true">└ </span> : null}
              {f.label}
              {f.required ? <span className="ml-1 text-xs text-red-300">(wajib)</span> : null}
            </td>
            <td className="py-2 pr-3 font-mono text-xs text-neutral-300 [overflow-wrap:anywhere]">
              {f.key}
              {f.kind === 'image' ? ` + ${f.altKey}` : ''}
            </td>
            <td className="py-2 text-neutral-300">{KIND_LABEL[f.kind]}</td>
          </tr>
          {f.kind === 'list' ? <FieldRows fields={f.fields} depth={depth + 1} /> : null}
        </React.Fragment>
      ))}
    </>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  return (
    <>
      <Button
        size="sm"
        icon={state === 'copied' ? Check : Copy}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setState('copied')
          } catch (err) {
            console.warn('[blocks-catalog] clipboard write failed:', err)
            setState('failed')
          }
        }}
      >
        {state === 'copied' ? 'Tersalin' : label}
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' ? `${label}: tersalin ke clipboard.` : state === 'failed' ? 'Gagal menyalin. Pilih teks lalu salin manual.' : ''}
      </span>
    </>
  )
}

function Detail({ entry }: { entry: BlockCatalogEntry }) {
  const example = useMemo(() => JSON.stringify(entry.example, null, 2), [entry])
  const schema = useMemo(() => JSON.stringify(blockJsonSchema(entry.type), null, 2), [entry])
  const previewBlocks = useMemo(() => [{ ...entry.example, id: `example-${entry.type}`, type: entry.type }], [entry])

  return (
    <article aria-labelledby="catalog-detail-title" className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="catalog-detail-title" className="font-heading text-xl font-semibold text-white">
            {entry.label}
          </h3>
          <Badge tone="neutral">{BLOCK_CATEGORY_LABEL[entry.category]}</Badge>
        </div>
        <p className="font-mono text-xs text-neutral-400">type: {entry.type}</p>
        <p className="max-w-prose text-sm leading-relaxed text-neutral-200">{entry.description}</p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-300">
          Dipakai di:
          {entry.targets.map((t) => (
            <Badge key={t} tone="info">
              {TARGET_LABEL[t]}
            </Badge>
          ))}
        </p>
      </header>

      <section aria-labelledby="catalog-fields" className="space-y-2">
        <h4 id="catalog-fields" className="text-sm font-semibold text-white">
          Kolom formulir
        </h4>
        <div className="overflow-x-auto rounded-xl border border-white/10 px-3">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Label
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Kunci
                </th>
                <th scope="col" className="py-2 font-medium">
                  Jenis
                </th>
              </tr>
            </thead>
            <tbody>
              <FieldRows fields={entry.fields} />
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="catalog-preview" className="space-y-2">
        <h4 id="catalog-preview" className="text-sm font-semibold text-white">
          Pratinjau contoh
        </h4>
        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-white/10">
          <BlockPreview blocks={previewBlocks} selectedId={null} scrollToSelected={false} />
        </div>
      </section>

      <section aria-labelledby="catalog-example" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 id="catalog-example" className="text-sm font-semibold text-white">
            Contoh payload
          </h4>
          <CopyButton text={example} label="Salin contoh" />
        </div>
        <pre tabIndex={0} aria-label="Contoh payload JSON" className={`max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed text-neutral-200 ${FOCUS_RING}`}>
          {example}
        </pre>
      </section>

      <section aria-labelledby="catalog-schema" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 id="catalog-schema" className="text-sm font-semibold text-white">
            JSON Schema
          </h4>
          <CopyButton text={schema} label="Salin JSON Schema" />
        </div>
        <details className="rounded-xl border border-white/10">
          <summary className={`cursor-pointer rounded-xl px-3 py-2 text-sm text-neutral-200 ${FOCUS_RING}`}>Tampilkan skema (untuk MCP / integrasi)</summary>
          <pre tabIndex={0} aria-label="JSON Schema" className={`max-h-96 overflow-auto border-t border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed text-neutral-200 ${FOCUS_RING}`}>
            {schema}
          </pre>
        </details>
      </section>
    </article>
  )
}

const CATEGORIES = Object.keys(BLOCK_CATEGORY_LABEL) as BlockCategory[]

/**
 * "Blok" tab: the block catalogue as editors and integrators see it — label,
 * description, form fields, a rendered example, the example payload and the
 * JSON Schema. Reads `lib/blocks/catalog` directly (same source as the editor,
 * `/api/blocks/manifest` and MCP).
 */
export function StudioBlocksCatalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<BlockCategory | 'all'>('all')
  const [selectedType, setSelectedType] = useState(BLOCK_CATALOG[0]?.type ?? '')

  const results = useMemo(
    () => filterBlocks(BLOCK_CATALOG, query).filter((e) => category === 'all' || e.category === category),
    [query, category],
  )
  const selected = BLOCK_CATALOG.find((e) => e.type === selectedType) ?? results[0]

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-heading text-lg font-semibold text-white">Katalog blok</h2>
        <p className="max-w-prose text-sm text-neutral-300">
          {BLOCK_CATALOG.length} jenis blok yang bisa dipakai di halaman, portofolio, dan layanan. Sumber yang sama dipakai editor blok, API manifest,
          dan MCP.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <label htmlFor="catalog-search" className="sr-only">
              Cari blok
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              placeholder="Cari blok…"
              onChange={(e) => setQuery(e.target.value)}
              className={inputClass(false, 'h-10 pl-9')}
            />
          </div>
          <div>
            <label htmlFor="catalog-category" className="mb-1 block text-xs text-neutral-300">
              Kategori
            </label>
            <select id="catalog-category" value={category} onChange={(e) => setCategory(e.target.value as BlockCategory | 'all')} className={inputClass(false, 'h-10')}>
              <option value="all">Semua kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BLOCK_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <p role="status" className="text-xs text-neutral-400">
            {results.length} blok
          </p>
          <ul className="space-y-1" aria-label="Daftar blok">
            {results.map((entry) => {
              const isSelected = entry.type === selected?.type
              return (
                <li key={entry.type}>
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => setSelectedType(entry.type)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left ${
                      isSelected ? 'border-accent-400/70 bg-accent-500/10' : 'border-transparent hover:bg-white/[0.05]'
                    } ${FOCUS_RING}`}
                  >
                    <span className="mt-0.5 text-neutral-300">
                      <CategoryIcon category={entry.category} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">{entry.label}</span>
                      <span className="block font-mono text-xs text-neutral-400">{entry.type}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {results.length === 0 ? <p className="text-sm text-neutral-300">Tidak ada blok yang cocok. Hapus filter atau coba kata lain.</p> : null}
        </div>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-surface-elevated p-4 sm:p-6">
          {selected ? <Detail entry={selected} /> : <p className="text-sm text-neutral-300">Pilih blok untuk melihat detailnya.</p>}
        </div>
      </div>
    </div>
  )
}
