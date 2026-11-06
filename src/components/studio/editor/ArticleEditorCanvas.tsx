'use client'

import React, { memo, useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { CategoryCombobox } from './CategoryCombobox'
import { siteConfig } from '@/config/site'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import {
  Heading2,
  Heading3,
  Quote,
  List,
  Code,
  Image as ImageIcon,
  Video,
  HelpCircle,
  Minus,
  FileText,
  ChevronUp,
  ChevronDown,
  Table as TableIcon,
  Trash2,
  Plus,
  Link2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Unlink,
  ExternalLink,
  Layers,
  Sparkles,
  Upload,
  AlertTriangle,
} from 'lucide-react'
import {
  ContentBlock,
  BlockType,
  TableBlock,
  extractEmbedUrl,
  generateHeadingSlug,
} from '@/lib/articles/blockEditor'
import { EditorDialog, dialogButton } from './EditorDialog'

/**
 * Auto-resizing Textarea component (Notion/Medium canvas standard).
 */
type AutoResizeTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string
  onChange: (val: string) => void
  minHeight?: number
}

export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = 24,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.max(minHeight, el.scrollHeight)
    el.style.height = `${newHeight}px`
  }

  useLayoutEffect(() => {
    adjustHeight()
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        adjustHeight()
      }}
      placeholder={placeholder}
      rows={1}
      className={`overflow-hidden resize-none transition-none block w-full ${className}`}
      {...props}
    />
  )
}

function getBlockLabel(type: BlockType): string {
  switch (type) {
    case 'html':
      return 'Konten impor'
    case 'paragraph':
      return 'Teks'
    case 'heading2':
      return 'H2'
    case 'heading3':
      return 'H3'
    case 'quote':
      return 'Kutipan'
    case 'list':
      return 'Daftar'
    case 'faq':
      return 'FAQ'
    case 'code':
      return 'Kode'
    case 'image':
      return 'Gambar'
    case 'video':
      return 'Video'
    case 'divider':
      return 'Garis'
    case 'internal-links':
      return 'Tautan'
    case 'table':
      return 'Tabel'
    default:
      return type
  }
}

/**
 * Rich ContentEditable Text Component with floating selection bubble & link popover
 */
export function RichContentEditable({
  initialHtml,
  onChange,
  placeholder,
  label,
  className = '',
}: {
  initialHtml: string
  onChange: (html: string) => void
  placeholder?: string
  /** Accessible name of the editable region (a placeholder is not a label). */
  label: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Floating Selection Bubble Toolbar State
  const [selectionToolbar, setSelectionToolbar] = useState<{
    top: number
    left: number
    selectedText: string
  } | null>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInputUrl, setLinkInputUrl] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (ref.current && !isComposingRef.current) {
      if (ref.current.innerHTML !== initialHtml) {
        ref.current.innerHTML = sanitizeHtmlContent(initialHtml || '')
      }
    }
  }, [initialHtml])

  const handleInput = () => {
    if (ref.current) {
      isComposingRef.current = true
      onChange(sanitizeHtmlContent(ref.current.innerHTML))
    }
  }

  const handleBlur = () => {
    isComposingRef.current = false
    if (ref.current) {
      onChange(sanitizeHtmlContent(ref.current.innerHTML))
    }
  }

  const checkSelection = () => {
    if (typeof window === 'undefined') return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !ref.current) {
      if (!showLinkInput) setSelectionToolbar(null)
      return
    }

    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (ref.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect()
        setSelectionToolbar({
          top: Math.max(10, rect.top - 46),
          left: Math.max(10, rect.left + rect.width / 2),
          selectedText: sel.toString(),
        })
      } else {
        if (!showLinkInput) setSelectionToolbar(null)
      }
    }
  }

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    if (typeof document === 'undefined') return
    document.execCommand(command, false, value)
    if (ref.current) {
      onChange(sanitizeHtmlContent(ref.current.innerHTML))
    }
    setTimeout(checkSelection, 50)
  }

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkInputUrl.trim()) return
    let finalUrl = linkInputUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
      finalUrl = `https://${finalUrl}`
    }
    applyFormat('createLink', finalUrl)
    setShowLinkInput(false)
    setLinkInputUrl('')
    setSelectionToolbar(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && selectionToolbar) {
      e.stopPropagation()
      setShowLinkInput(false)
      setSelectionToolbar(null)
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed) {
        checkSelection()
        setShowLinkInput(true)
      }
    }
  }

  return (
    <div className="relative group">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={handleInput}
        onBlur={handleBlur}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={`min-h-[28px] empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-600 empty:before:pointer-events-none ${className}`}
      />

      {/* Floating Selection Bubble Toolbar */}
      {mounted &&
        selectionToolbar &&
        createPortal(
          <div
            style={{
              top: `${selectionToolbar.top}px`,
              left: `${selectionToolbar.left}px`,
              transform: 'translateX(-50%)',
            }}
            role="toolbar"
            aria-label="Format teks terpilih"
            className="fixed z-50 flex items-center gap-0.5 bg-surface-elevated border border-white/20 rounded-xl px-1.5 py-1 shadow-2xl backdrop-blur-xl text-xs text-white"
            onMouseDown={(e) => {
              if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowLinkInput(false)
                setSelectionToolbar(null)
                ref.current?.focus()
              }
            }}
          >
            {showLinkInput ? (
              <form onSubmit={handleInsertLink} className="flex items-center gap-1.5 px-1 py-0.5">
                <Link2 className="w-3.5 h-3.5 text-accent-400 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  inputMode="url"
                  aria-label="URL tautan"
                  autoFocus
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  placeholder="https://... atau /services"
                  className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400 w-48 font-mono"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-accent-500 text-accent-950 font-bold text-xs hover:bg-accent-300 transition-colors"
                >
                  Sisipkan
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className="px-1.5 py-1 text-neutral-400 hover:text-white text-xs"
                >
                  Batal
                </button>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => applyFormat('bold')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Bold (Ctrl+B / ⌘B)"
                  aria-label="Tebal"
                >
                  <Bold className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Italic (Ctrl+I / ⌘I)"
                  aria-label="Miring"
                >
                  <Italic className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('underline')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Underline (Ctrl+U / ⌘U)"
                  aria-label="Garis bawah"
                >
                  <Underline className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('strikeThrough')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Strikethrough"
                  aria-label="Coret"
                >
                  <Strikethrough className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <div className="h-4 w-px bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={() => setShowLinkInput(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-accent-300 hover:text-accent-200 transition-colors flex items-center gap-1 font-semibold"
                  title="Sisipkan Tautan (Ctrl+K / ⌘K)"
                >
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="text-[11px]">Tautan</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('unlink')}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-300 transition-colors"
                  title="Hapus Tautan"
                  aria-label="Hapus tautan"
                >
                  <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

/**
 * Rich ContentEditable List Item Component
 */
export function RichListItemEditable({
  initialHtml,
  onChange,
  onEnter,
  onDeleteIfEmpty,
  placeholder = 'Tulis poin...',
  label,
}: {
  initialHtml: string
  onChange: (html: string) => void
  onEnter?: () => void
  onDeleteIfEmpty?: () => void
  placeholder?: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef(false)

  useEffect(() => {
    if (ref.current && !isComposingRef.current) {
      if (ref.current.innerHTML !== initialHtml) {
        ref.current.innerHTML = sanitizeHtmlContent(initialHtml || '')
      }
    }
  }, [initialHtml])

  const handleInput = () => {
    if (ref.current) {
      isComposingRef.current = true
      onChange(sanitizeHtmlContent(ref.current.innerHTML))
    }
  }

  const handleBlur = () => {
    isComposingRef.current = false
    if (ref.current) {
      onChange(sanitizeHtmlContent(ref.current.innerHTML))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter?.()
    } else if (e.key === 'Backspace' && !ref.current?.innerText.trim()) {
      onDeleteIfEmpty?.()
    }
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className="flex-1 bg-transparent border-0 border-b border-transparent focus:border-accent-400 text-xs text-neutral-200 focus:outline-none py-1 min-h-[22px] empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-600 [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_a]:text-accent-400 [&_a]:underline"
    />
  )
}

/**
 * Notion-style interactive Table Block Editor
 */
export function NotionTableEditor({
  block,
  onUpdateBlock,
}: {
  block: TableBlock
  onUpdateBlock: (id: string, updated: Partial<TableBlock>) => void
}) {
  const hasHeaders = block.hasHeaderRow !== false
  const headers = block.headers || []
  const rows = block.rows || []
  const columnCount = Math.max(headers.length, rows[0]?.length || 2)

  // Distribute columns equally
  const handleDistributeEqually = () => {
    const widthPerCol = Math.floor(100 / columnCount)
    const newWidths = Array(columnCount).fill(widthPerCol)
    newWidths[newWidths.length - 1] += 100 - widthPerCol * columnCount
    onUpdateBlock(block.id, { columnWidths: newWidths })
  }

  // Auto-width based on content
  const handleAutoWidth = () => {
    onUpdateBlock(block.id, { columnWidths: undefined })
  }

  // Add column
  const handleAddColumn = () => {
    const newHeaders = [...headers, `Kolom ${columnCount + 1}`]
    const newRows = rows.map((r) => [...r, ''])
    const newWidths = block.columnWidths
      ? Array(columnCount + 1).fill(Math.floor(100 / (columnCount + 1)))
      : undefined
    onUpdateBlock(block.id, {
      headers: newHeaders,
      rows: newRows,
      columnWidths: newWidths,
    })
  }

  // Delete column
  const handleDeleteColumn = (colIdx: number) => {
    if (columnCount <= 1) return
    const newHeaders = headers.filter((_, i) => i !== colIdx)
    const newRows = rows.map((r) => r.filter((_, i) => i !== colIdx))
    const newWidths = block.columnWidths
      ? block.columnWidths.filter((_, i) => i !== colIdx)
      : undefined
    onUpdateBlock(block.id, {
      headers: newHeaders,
      rows: newRows,
      columnWidths: newWidths,
    })
  }

  // Add row
  const handleAddRow = () => {
    const newRow = Array(columnCount).fill('')
    onUpdateBlock(block.id, { rows: [...rows, newRow] })
  }

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) return
    onUpdateBlock(block.id, { rows: rows.filter((_, i) => i !== rowIdx) })
  }

  // Update header text
  const handleUpdateHeader = (colIdx: number, val: string) => {
    const newHeaders = [...headers]
    newHeaders[colIdx] = val
    onUpdateBlock(block.id, { headers: newHeaders })
  }

  // Update cell text
  const handleUpdateCell = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = rows.map((r, ri) => (ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? val : c)) : r))
    onUpdateBlock(block.id, { rows: newRows })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-3">
      {/* Top Table Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <TableIcon className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-blue-300 font-mono">Tabel data</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
            {columnCount} Kolom × {rows.length} Baris
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => onUpdateBlock(block.id, { hasHeaderRow: !hasHeaders })}
            aria-pressed={hasHeaders}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              hasHeaders ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            title="Sembunyikan atau tampilkan baris header"
          >
            Header: {hasHeaders ? 'Aktif' : 'Nonaktif'}
          </button>

          <button
            type="button"
            onClick={block.columnWidths ? handleAutoWidth : handleDistributeEqually}
            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
            title={block.columnWidths ? 'Ganti ke mode lebar otomatis berdasarkan panjang teks' : 'Bagi rata lebar semua kolom secara proporsional'}
          >
            {block.columnWidths ? 'Mode: Rata (%)' : 'Mode: Otomatis (Teks)'}
          </button>

          <button
            type="button"
            onClick={handleAddColumn}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] font-semibold transition-colors"
            title="Tambah kolom baru ke tabel"
          >
            <Plus className="w-3 h-3" />
            <span>Kolom</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] font-semibold transition-colors"
            title="Tambah baris baru ke tabel"
          >
            <Plus className="w-3 h-3" />
            <span>Baris</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/60 scrollbar-thin">
        <table className={`w-full text-left text-xs border-collapse ${block.columnWidths ? 'table-fixed' : 'table-auto'}`}>
          {block.columnWidths && (
            <colgroup>
              {block.columnWidths.map((w, idx) => (
                <col key={idx} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
          )}

          {hasHeaders && (
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10">
                {Array.from({ length: columnCount }).map((_, colIdx) => (
                  <th key={colIdx} className="p-2 text-neutral-200 font-semibold group/th relative">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={headers[colIdx] || ''}
                        onChange={(e) => handleUpdateHeader(colIdx, e.target.value)}
                        placeholder={`Kolom ${colIdx + 1}`}
                        aria-label={`Judul kolom ${colIdx + 1}`}
                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-accent-400 font-semibold text-xs text-white focus:outline-none p-1 placeholder:text-neutral-500"
                      />
                      {columnCount > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="opacity-60 group-hover/th:opacity-100 focus-visible:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity"
                          aria-label={`Hapus kolom ${colIdx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-8 p-1 text-center border-l border-white/5" />
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/[0.02] group/tr transition-colors">
                {Array.from({ length: columnCount }).map((_, colIdx) => (
                  <td key={colIdx} className="p-2 text-neutral-300 align-top">
                    <RichListItemEditable
                      initialHtml={row[colIdx] || ''}
                      onChange={(val) => handleUpdateCell(rowIdx, colIdx, val)}
                      placeholder="Ketik..."
                      label={`Sel baris ${rowIdx + 1}, kolom ${colIdx + 1}`}
                    />
                  </td>
                ))}
                <td className="w-8 p-1 text-center align-middle border-l border-white/5">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="opacity-60 group-hover/tr:opacity-100 focus-visible:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity"
                      aria-label={`Hapus baris ${rowIdx + 1}`}
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick Row Inserter */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500 font-mono">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
        >
          <Plus className="w-3 h-3" />
          <span>Tambah Baris Baru</span>
        </button>
        <span className="text-[10px]">Tips: Lebar kolom otomatis menyesuaikan panjang kalimat atau klik &quot;Mode: Rata&quot;</span>
      </div>
    </div>
  )
}

/** Stable callbacks for block mutations (created once in the editor page). */
export interface BlockActions {
  add: (type: BlockType) => void
  update: (id: string, updated: Partial<ContentBlock>) => void
  remove: (id: string) => void
  move: (id: string, direction: 'up' | 'down') => void
  convert: (id: string, targetType: BlockType) => void
  toggleRawHtml: (id: string) => void
  openMediaPicker: (id: string) => void
  splitHtml: (id: string) => void
}

const CONVERTIBLE_TYPES: Array<{ type: BlockType; label: string }> = [
  { type: 'paragraph', label: 'Paragraf' },
  { type: 'heading2', label: 'Subjudul H2' },
  { type: 'heading3', label: 'Subjudul H3' },
  { type: 'quote', label: 'Kutipan' },
  { type: 'list', label: 'Daftar' },
  { type: 'code', label: 'Kode' },
  { type: 'table', label: 'Tabel' },
  { type: 'html', label: 'HTML kustom' },
]

const ADDABLE_TYPES: Array<{ type: BlockType; label: string; icon: typeof FileText; iconClass: string }> = [
  { type: 'paragraph', label: 'Paragraf', icon: FileText, iconClass: 'text-accent-400' },
  { type: 'heading2', label: 'Subjudul H2', icon: Heading2, iconClass: 'text-info-300' },
  { type: 'heading3', label: 'Subjudul H3', icon: Heading3, iconClass: 'text-info-300' },
  { type: 'image', label: 'Gambar', icon: ImageIcon, iconClass: 'text-emerald-400' },
  { type: 'video', label: 'Video', icon: Video, iconClass: 'text-rose-400' },
  { type: 'quote', label: 'Kutipan', icon: Quote, iconClass: 'text-amber-400' },
  { type: 'list', label: 'Daftar', icon: List, iconClass: 'text-purple-400' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, iconClass: 'text-teal-400' },
  { type: 'code', label: 'Kode', icon: Code, iconClass: 'text-cyan-400' },
  { type: 'html', label: 'HTML', icon: Code, iconClass: 'text-amber-400' },
  { type: 'divider', label: 'Garis pemisah', icon: Minus, iconClass: 'text-neutral-400' },
  { type: 'internal-links', label: 'Tautan internal', icon: Link2, iconClass: 'text-emerald-400' },
  { type: 'table', label: 'Tabel', icon: TableIcon, iconClass: 'text-blue-400' },
]

const toolbarBtn =
  'inline-flex h-7 min-w-7 items-center justify-center rounded px-1 text-neutral-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'

interface BlockRowProps {
  block: ContentBlock
  index: number
  count: number
  isRaw: boolean
  actions: BlockActions
}

/**
 * One block in the canvas. Memoized: typing in one block only re-renders that row, because
 * untouched blocks keep their object identity and `actions` is stable.
 */
const BlockRow = memo(function BlockRow({ block, index, count, isRaw, actions }: BlockRowProps) {
  const label = getBlockLabel(block.type)
  const position = `Blok ${index + 1} dari ${count}`
  const typeOptions = CONVERTIBLE_TYPES.some((o) => o.type === block.type)
    ? CONVERTIBLE_TYPES
    : [{ type: block.type, label }, ...CONVERTIBLE_TYPES]

  return (
    <div
      role="group"
      aria-label={`${position}: ${label}`}
      data-block-index={index}
      tabIndex={-1}
      className="relative group rounded-xl py-1.5 px-3 -mx-3 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/10 focus-within:border-accent-400"
    >
      {/* Block toolbar: in-flow on small screens, floating on hover/focus from sm up */}
      <div
        role="toolbar"
        aria-label={`Alat ${position}`}
        className="mb-1 flex items-center justify-end gap-1 text-[11px] text-neutral-300 sm:absolute sm:-top-4 sm:right-2 sm:z-10 sm:mb-0 sm:rounded-md sm:border sm:border-white/15 sm:bg-surface-elevated sm:px-1.5 sm:py-0.5 sm:shadow-xl sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 motion-safe:transition-opacity"
      >
        <label className="sr-only" htmlFor={`block-${block.id}-type`}>
          Jenis {position}
        </label>
        <select
          id={`block-${block.id}-type`}
          value={block.type}
          onChange={(e) => {
            const next = typeOptions.find((o) => o.type === e.target.value)
            if (next) actions.convert(block.id, next.type)
          }}
          className="h-7 rounded border border-white/15 bg-surface-elevated px-1.5 font-mono text-[11px] text-white"
        >
          {typeOptions.map((o) => (
            <option key={o.type} value={o.type}>
              {o.label}
            </option>
          ))}
        </select>

        {(block.type === 'paragraph' || block.type === 'quote' || block.type === 'list') && (
          <button
            type="button"
            onClick={() => actions.toggleRawHtml(block.id)}
            aria-pressed={isRaw}
            aria-label="Edit sebagai HTML"
            title="Edit sebagai HTML"
            className={`${toolbarBtn} font-mono ${isRaw ? 'bg-accent-500/25 text-accent-300' : ''}`}
          >
            &lt;/&gt;
          </button>
        )}

        <button
          type="button"
          onClick={() => actions.move(block.id, 'up')}
          disabled={index === 0}
          aria-label={`Pindahkan ${label.toLowerCase()} ke atas`}
          title="Pindah ke atas"
          className={toolbarBtn}
        >
          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => actions.move(block.id, 'down')}
          disabled={index === count - 1}
          aria-label={`Pindahkan ${label.toLowerCase()} ke bawah`}
          title="Pindah ke bawah"
          className={toolbarBtn}
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => actions.remove(block.id)}
          aria-label={`Hapus ${label.toLowerCase()} (bisa diurungkan)`}
          title="Hapus blok"
          className={`${toolbarBtn} text-rose-300 hover:bg-rose-500/20 hover:text-rose-200`}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <BlockBody block={block} isRaw={isRaw} actions={actions} position={position} />
    </div>
  )
})

function BlockBody({ block, isRaw, actions, position }: { block: ContentBlock; isRaw: boolean; actions: BlockActions; position: string }) {
  const update = actions.update
  switch (block.type) {
    case 'paragraph':
      return isRaw ? (
        <AutoResizeTextarea
          value={block.text}
          onChange={(val) => update(block.id, { text: val })}
          aria-label={`HTML paragraf, ${position}`}
          placeholder="Ketik kode HTML atau paragraf..."
          minHeight={28}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-emerald-300 placeholder:text-neutral-500 leading-relaxed"
        />
      ) : (
        <RichContentEditable
          initialHtml={block.text}
          onChange={(val) => update(block.id, { text: val })}
          label={`Paragraf, ${position}`}
          placeholder="Mulai ketik paragraf… Pilih teks untuk format; Ctrl/⌘+K untuk tautan."
          className="w-full bg-transparent border-0 text-[15px] sm:text-base text-neutral-200 leading-[1.75] font-sans p-0 focus-visible:outline-none selection:bg-accent-500/30"
        />
      )

    case 'heading2':
    case 'heading3': {
      const anchor = generateHeadingSlug(block.text)
      const isH2 = block.type === 'heading2'
      return (
        <div className="relative pt-1">
          <AutoResizeTextarea
            value={block.text}
            onChange={(val) => update(block.id, { text: val })}
            aria-label={`${isH2 ? 'Subjudul H2' : 'Subjudul H3'}, ${position}`}
            placeholder={isH2 ? 'Subjudul H2...' : 'Subjudul H3...'}
            minHeight={isH2 ? 32 : 28}
            className={`w-full bg-transparent border-0 placeholder:text-neutral-500 leading-snug font-display p-0 focus-visible:outline-none ${
              isH2 ? 'text-xl sm:text-2xl font-bold text-white' : 'text-lg sm:text-xl font-semibold text-neutral-200'
            }`}
          />
          {anchor && (
            <p className="mt-1 break-all font-mono text-[10px] text-neutral-400">
              <span className="sr-only">Anchor tautan: </span>#{anchor}
            </p>
          )}
        </div>
      )
    }

    case 'image':
      return (
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gambar</span>
            </span>
            <button
              type="button"
              onClick={() => actions.openMediaPicker(block.id)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold transition-colors"
            >
              {block.url ? 'Ganti gambar' : 'Pilih gambar'}
            </button>
          </div>

          {block.url && (
            <div className="relative aspect-[16/9] w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.alt || ''} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label htmlFor={`block-${block.id}-alt`} className="text-[11px] font-mono text-neutral-300 block mb-0.5">
                Alt text (wajib)
              </label>
              <input
                id={`block-${block.id}-alt`}
                type="text"
                value={block.alt || ''}
                onChange={(e) => update(block.id, { alt: e.target.value })}
                aria-invalid={block.url && !block.alt?.trim() ? true : undefined}
                aria-describedby={block.url && !block.alt?.trim() ? `block-${block.id}-alt-error` : undefined}
                placeholder="Deskripsi singkat gambar..."
                className="w-full rounded-lg bg-black/40 border border-white/15 p-1.5 text-xs text-white aria-[invalid=true]:border-amber-400"
              />
              {block.url && !block.alt?.trim() && (
                <p id={`block-${block.id}-alt-error`} className="mt-1 flex items-center gap-1 text-[11px] text-amber-300">
                  <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                  Isi alt text agar artikel bisa diterbitkan.
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`block-${block.id}-caption`} className="text-[11px] font-mono text-neutral-300 block mb-0.5">
                Keterangan (opsional)
              </label>
              <input
                id={`block-${block.id}-caption`}
                type="text"
                value={block.caption || ''}
                onChange={(e) => update(block.id, { caption: e.target.value })}
                placeholder="Keterangan gambar..."
                className="w-full rounded-lg bg-black/40 border border-white/15 p-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )

    case 'video':
      return (
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
          <label htmlFor={`block-${block.id}-url`} className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
            <Video className="w-3.5 h-3.5" aria-hidden="true" />
            <span>URL video YouTube / Vimeo</span>
          </label>
          <input
            id={`block-${block.id}-url`}
            type="url"
            inputMode="url"
            value={block.url || ''}
            onChange={(e) => update(block.id, { url: e.target.value, embedUrl: extractEmbedUrl(e.target.value) })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs font-mono text-neutral-200"
          />
          {block.url && (
            <div className="aspect-video w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-white/10 bg-black">
              <iframe
                src={block.embedUrl || extractEmbedUrl(block.url)}
                title={block.title || 'Pratinjau video'}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )

    case 'quote':
      return (
        <div className="border-l-4 border-amber-400 bg-amber-400/[0.04] p-4 rounded-r-xl space-y-2">
          {isRaw ? (
            <AutoResizeTextarea
              value={block.text}
              onChange={(val) => update(block.id, { text: val })}
              aria-label={`HTML kutipan, ${position}`}
              placeholder="Ketik kutipan (HTML)..."
              minHeight={32}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-amber-300 leading-relaxed"
            />
          ) : (
            <RichContentEditable
              initialHtml={block.text}
              onChange={(val) => update(block.id, { text: val })}
              label={`Kutipan, ${position}`}
              placeholder="Ketik kutipan di sini..."
              className="text-base sm:text-lg italic text-neutral-100 leading-relaxed min-h-[32px] focus-visible:outline-none [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_a]:text-accent-300 [&_a]:underline"
            />
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <span className="text-[11px] font-mono text-neutral-400" aria-hidden="true">—</span>
            <input
              type="text"
              value={block.author || ''}
              onChange={(e) => update(block.id, { author: e.target.value })}
              aria-label="Sumber kutipan (opsional)"
              placeholder="Nama tokoh / pakar (opsional)"
              className="min-w-0 flex-1 bg-transparent border-0 text-xs text-amber-300 placeholder:text-neutral-500 p-0 font-medium"
            />
          </div>
        </div>
      )

    case 'list':
      return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 font-semibold text-purple-300">
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Daftar {block.ordered ? 'bernomor' : 'poin'}</span>
            </span>
            <button
              type="button"
              onClick={() => update(block.id, { ordered: !block.ordered })}
              className="text-[11px] text-accent-300 underline-offset-2 hover:underline"
            >
              Ubah ke {block.ordered ? 'poin' : 'nomor'}
            </button>
          </div>

          <ol className="space-y-1.5 pl-2 list-none">
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-2 group/item">
                <span className="text-xs text-neutral-400 font-mono w-4 text-right shrink-0 pt-1" aria-hidden="true">
                  {block.ordered ? `${itemIdx + 1}.` : '•'}
                </span>
                {isRaw ? (
                  <input
                    type="text"
                    value={item}
                    aria-label={`Poin ${itemIdx + 1} (HTML)`}
                    onChange={(e) => {
                      const newItems = [...block.items]
                      newItems[itemIdx] = e.target.value
                      update(block.id, { items: newItems })
                    }}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-neutral-200"
                    placeholder="Tulis poin (HTML)..."
                  />
                ) : (
                  <RichListItemEditable
                    initialHtml={item}
                    label={`Poin ${itemIdx + 1}`}
                    onChange={(val) => {
                      const newItems = [...block.items]
                      newItems[itemIdx] = val
                      update(block.id, { items: newItems })
                    }}
                    onEnter={() => {
                      const newItems = [...block.items]
                      newItems.splice(itemIdx + 1, 0, '')
                      update(block.id, { items: newItems })
                    }}
                    onDeleteIfEmpty={() => {
                      if (block.items.length > 1) update(block.id, { items: block.items.filter((_, i) => i !== itemIdx) })
                    }}
                    placeholder="Tulis poin..."
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newItems = block.items.filter((_, i) => i !== itemIdx)
                    update(block.id, { items: newItems.length ? newItems : [''] })
                  }}
                  className="p-1 text-neutral-400 hover:text-red-400 transition-colors opacity-60 group-hover/item:opacity-100 focus-visible:opacity-100"
                  aria-label={`Hapus poin ${itemIdx + 1}`}
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => update(block.id, { items: [...block.items, ''] })}
            className="inline-flex items-center gap-1 text-[11px] text-accent-300 hover:text-white font-semibold pt-1"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            <span>Tambah poin</span>
          </button>
        </div>
      )

    case 'faq':
      return (
        <div className="rounded-xl border border-teal-500/25 bg-teal-950/10 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>FAQ</span>
          </p>
          <input
            type="text"
            value={block.question}
            onChange={(e) => update(block.id, { question: e.target.value })}
            aria-label="Pertanyaan"
            placeholder="Pertanyaan?"
            className="w-full bg-black/40 border border-white/15 rounded-lg p-2 text-xs font-bold text-white"
          />
          <AutoResizeTextarea
            value={block.answer}
            onChange={(val) => update(block.id, { answer: val })}
            aria-label="Jawaban"
            placeholder="Jawaban ringkas dan informatif..."
            minHeight={40}
            className="w-full bg-black/40 border border-white/15 rounded-lg p-2 text-xs text-neutral-200 leading-relaxed"
          />
        </div>
      )

    case 'code':
      return (
        <div className="rounded-xl border border-white/15 bg-black/70 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-300">
            <label htmlFor={`block-${block.id}-code`} className="flex items-center gap-1.5 font-mono text-cyan-300">
              <Code className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kode program</span>
            </label>
            <select
              value={block.language || 'typescript'}
              onChange={(e) => update(block.id, { language: e.target.value })}
              aria-label="Bahasa kode"
              className="bg-white/10 border border-white/15 rounded px-2 py-0.5 text-[11px] font-mono text-white"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="python">Python</option>
              <option value="bash">Bash / Shell</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <textarea
            id={`block-${block.id}-code`}
            rows={5}
            value={block.code}
            onChange={(e) => update(block.id, { code: e.target.value })}
            className="w-full font-mono text-xs bg-black/50 border border-white/10 rounded-lg p-3 text-cyan-300 leading-relaxed"
            placeholder="// Tulis kode..."
          />
        </div>
      )

    case 'divider':
      return (
        <div className="py-3 flex items-center justify-center">
          <hr className="h-px w-full border-0 bg-white/15" />
        </div>
      )

    case 'html':
      return (
        <div className="rounded-xl border border-amber-500/30 bg-black/60 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-amber-300">
              <Code className="w-3.5 h-3.5" aria-hidden="true" />
              HTML kustom / impor
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => actions.splitHtml(block.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold transition-colors"
                title="Ubah tag HTML di blok ini menjadi blok terpisah (judul, paragraf, daftar, dll.)"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pecah jadi blok standar</span>
              </button>
              <button
                type="button"
                onClick={() => actions.toggleRawHtml(block.id)}
                aria-pressed={isRaw}
                className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-white/10 text-neutral-200 hover:text-white"
              >
                {isRaw ? 'Lihat pratinjau' : 'Edit kode'}
              </button>
            </div>
          </div>

          {isRaw ? (
            <AutoResizeTextarea
              value={block.html}
              onChange={(val) => update(block.id, { html: val })}
              aria-label={`Kode HTML, ${position}`}
              placeholder="<div>...</div>"
              minHeight={90}
              className="w-full bg-black/70 border border-white/10 rounded-lg p-3 font-mono text-xs text-amber-300 leading-relaxed"
            />
          ) : (
            <div
              className="prose prose-invert max-w-none text-xs p-3.5 bg-neutral-900/60 rounded-xl border border-white/10 overflow-x-auto text-neutral-300"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.html) }}
            />
          )}
        </div>
      )

    case 'internal-links':
      return (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[12rem]">
              <Link2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={block.title ?? ''}
                onChange={(e) => update(block.id, { title: e.target.value })}
                aria-label="Judul grup tautan internal"
                placeholder="Judul grup tautan internal..."
                className="bg-transparent border-0 border-b border-transparent focus:border-emerald-400/50 font-semibold text-xs sm:text-sm text-emerald-300 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => update(block.id, { links: [...(block.links || []), { text: '', href: '' }] })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tambah tautan ({block.links?.length || 0})</span>
            </button>
          </div>

          {!block.links || block.links.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2 text-center">Belum ada tautan. Pilih &ldquo;Tambah tautan&rdquo;.</p>
          ) : (
            <ul className="space-y-2">
              {block.links.map((link, linkIdx) => (
                <li key={linkIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
                  <input
                    type="text"
                    value={link.text}
                    aria-label={`Teks tautan ${linkIdx + 1}`}
                    onChange={(e) => {
                      const newLinks = [...block.links]
                      newLinks[linkIdx] = { ...newLinks[linkIdx], text: e.target.value }
                      update(block.id, { links: newLinks })
                    }}
                    placeholder="Teks tautan..."
                    className="min-w-0 flex-1 bg-transparent border-0 border-b border-white/10 text-xs text-white placeholder:text-neutral-500 py-1"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="url"
                      value={link.href}
                      aria-label={`URL tautan ${linkIdx + 1}`}
                      onChange={(e) => {
                        const newLinks = [...block.links]
                        newLinks[linkIdx] = { ...newLinks[linkIdx], href: e.target.value }
                        update(block.id, { links: newLinks })
                      }}
                      placeholder="/services/... atau https://..."
                      className="min-w-0 w-full bg-transparent border-0 border-b border-white/10 font-mono text-[11px] text-accent-300 placeholder:text-neutral-500 py-1"
                    />
                    {link.href && (
                      <a
                        href={link.href.startsWith('/') ? `${siteConfig.url}${link.href}` : link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-neutral-300 hover:text-white transition-colors shrink-0"
                        aria-label={`Buka tautan ${linkIdx + 1} di tab baru`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => update(block.id, { links: block.links.filter((_, i) => i !== linkIdx) })}
                      className="p-1 text-neutral-400 hover:text-red-400 transition-colors shrink-0"
                      aria-label={`Hapus tautan ${linkIdx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )

    case 'table':
      return <NotionTableEditor block={block} onUpdateBlock={update} />

    default: {
      const unreachable: never = block
      return unreachable
    }
  }
}

interface ArticleEditorCanvasProps {
  title: string
  onTitleChange: (val: string) => void
  slug: string
  category: string
  categoriesList: Array<{ name: string; slug?: string }>
  onCategoryChange: (cat: string) => void
  editorStyle: 'blocks' | 'raw'
  onEditorStyleChange: (style: 'blocks' | 'raw') => void
  onConvertRawToBlocks: () => void
  onImportMarkdown: (markdown: string, useExtractedTitle: boolean) => void
  rawContent: string
  onRawContentChange: (val: string) => void
  blocks: ContentBlock[]
  blockActions: BlockActions
  rawHtmlBlockIds: Record<string, boolean>
  isFocusMode: boolean
}

export const ArticleEditorCanvas = memo(function ArticleEditorCanvas({
  title,
  onTitleChange,
  slug,
  category,
  categoriesList,
  onCategoryChange,
  editorStyle,
  onEditorStyleChange,
  onConvertRawToBlocks,
  onImportMarkdown,
  rawContent,
  onRawContentChange,
  blocks,
  blockActions,
  rawHtmlBlockIds,
  isFocusMode,
}: ArticleEditorCanvasProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [useExtractedTitle, setUseExtractedTitle] = useState(true)
  const [importError, setImportError] = useState<string | null>(null)

  const handleExecuteImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importText.trim()) {
      setImportError('Tempel teks Markdown terlebih dahulu.')
      document.getElementById('markdown-import-text')?.focus()
      return
    }
    onImportMarkdown(importText, useExtractedTitle)
    setIsImportModalOpen(false)
    setImportText('')
    setImportError(null)
  }

  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 scrollbar-thin">
      <div className={`mx-auto w-full ${isFocusMode ? 'max-w-4xl' : 'max-w-3xl'}`}>
        {/* Document header metadata: category & URL */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <label htmlFor="article-category-canvas" className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Kategori
            </label>
            <CategoryCombobox
              id="article-category-canvas"
              value={category}
              onChange={onCategoryChange}
              categoriesList={categoriesList}
              variant="canvas"
            />
          </div>

          <p className="flex min-w-0 items-center gap-1 text-xs font-mono text-neutral-400">
            <span className="sr-only">URL artikel: </span>
            <span>/journal/</span>
            <span className="text-accent-300 font-medium break-all">{slug || '…'}</span>
          </p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label htmlFor="article-title" className="sr-only">
            Judul artikel
          </label>
          <AutoResizeTextarea
            id="article-title"
            value={title}
            onChange={onTitleChange}
            placeholder="Ketik judul artikel di sini…"
            minHeight={48}
            className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-white/10 focus:border-accent-400 focus-visible:outline-none text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white placeholder:text-neutral-500 leading-[1.2] transition-colors font-display pb-3 p-0"
          />
        </div>

        {/* Content mode bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-3 mb-6 border-b border-white/[0.08]">
          <h2 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
            <span>Isi artikel</span>
            <span className="text-[11px] font-normal normal-case px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">
              {editorStyle === 'blocks' ? `${blocks.length} blok` : 'HTML / Markdown'}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-info-300 hover:text-white bg-info/10 hover:bg-info/20 border border-info/25 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Impor Markdown</span>
            </button>

            <div role="radiogroup" aria-label="Mode penyuntingan isi" className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
              {(
                [
                  { id: 'blocks', label: 'Blok', icon: Layers },
                  { id: 'raw', label: 'HTML / MD', icon: Code },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon
                const active = editorStyle === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onEditorStyleChange(opt.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      active ? 'bg-white/15 text-white font-bold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {editorStyle === 'raw' ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-400/25">
              <p className="flex items-center gap-2 text-xs text-blue-200">
                <Code className="w-4 h-4 text-blue-300 shrink-0" aria-hidden="true" />
                <span>Tulis HTML atau tempel Markdown, lalu ubah ke blok. Beralih ke mode Blok juga mengonversi otomatis.</span>
              </p>
              <button
                type="button"
                onClick={onConvertRawToBlocks}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ubah ke blok</span>
              </button>
            </div>

            <label htmlFor="article-raw-content" className="sr-only">
              Isi artikel (HTML atau Markdown)
            </label>
            <textarea
              id="article-raw-content"
              rows={22}
              value={rawContent}
              onChange={(e) => onRawContentChange(e.target.value)}
              className="w-full font-mono text-xs bg-black/50 border border-white/15 rounded-2xl p-5 text-emerald-300 leading-relaxed"
              placeholder={`# Judul Artikel\n## Subjudul Bagian\n\nTempel Markdown atau tulis HTML artikel di sini...`}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <BlockRow
                key={block.id}
                block={block}
                index={idx}
                count={blocks.length}
                isRaw={Boolean(rawHtmlBlockIds[block.id])}
                actions={blockActions}
              />
            ))}

            {/* Block inserter */}
            <div className="pt-6 mt-6 border-t border-white/[0.08]">
              <h3 id="block-inserter-heading" className="mb-2 text-[11px] font-mono text-neutral-300 font-semibold">
                Tambah blok
              </h3>
              <ul aria-labelledby="block-inserter-heading" className="flex flex-wrap items-center gap-1.5">
                {ADDABLE_TYPES.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.type}>
                      <button
                        type="button"
                        onClick={() => blockActions.add(item.type)}
                        className="min-h-8 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Icon className={`w-3.5 h-3.5 ${item.iconClass}`} aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

        <EditorDialog
          open={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false)
            setImportError(null)
          }}
          size="lg"
          icon={<Upload className="h-5 w-5 text-info-300" />}
          title="Impor Markdown"
          description="Tempel Markdown dari editor teks atau asisten AI. Judul, subjudul, kutipan, daftar, dan tabel diubah menjadi blok. Blok yang ada saat ini akan diganti."
          initialFocusId="markdown-import-text"
          footer={
            <>
              <button type="button" onClick={() => setIsImportModalOpen(false)} className={dialogButton.secondary}>
                Batal
              </button>
              <button type="submit" form="markdown-import-form" className={dialogButton.primary}>
                Ubah ke blok
              </button>
            </>
          }
        >
          <form id="markdown-import-form" onSubmit={handleExecuteImport} noValidate className="space-y-3">
            <label htmlFor="markdown-import-text" className="block text-xs font-semibold text-neutral-200">
              Teks Markdown
            </label>
            <textarea
              id="markdown-import-text"
              rows={13}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value)
                if (importError) setImportError(null)
              }}
              aria-invalid={importError ? true : undefined}
              aria-describedby={importError ? 'markdown-import-error' : undefined}
              className="w-full font-mono text-xs bg-black/70 border border-white/15 rounded-xl p-4 text-emerald-300 leading-relaxed scrollbar-thin resize-y"
              placeholder={`# Judul Artikel\n## Subjudul Bagian\n\nParagraf dengan **tebal** dan [tautan](/services)...`}
            />
            {importError && (
              <p id="markdown-import-error" className="flex items-center gap-1 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {importError}
              </p>
            )}
            <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useExtractedTitle}
                onChange={(e) => setUseExtractedTitle(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-black/40"
              />
              <span>
                Pakai baris <code className="text-[11px] text-info-300 font-mono"># Judul</code> sebagai judul artikel (jika judul masih kosong)
              </span>
            </label>
          </form>
        </EditorDialog>
      </div>
    </div>
  )
})
