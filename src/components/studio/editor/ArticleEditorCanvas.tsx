'use client'

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { CategoryCombobox } from './CategoryCombobox'
import { siteConfig } from '@/config/site'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import {
  AlignLeft,
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
  Columns,
  Trash2,
  Check,
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
  X,
} from 'lucide-react'
import {
  ContentBlock,
  BlockType,
  TableBlock,
  extractEmbedUrl,
  extractTitleAndContentFromMarkdown,
  generateHeadingSlug,
} from '@/lib/articles/blockEditor'

/**
 * Auto-resizing Textarea component (Notion/Medium canvas standard).
 */
export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = 24,
  ...props
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  [key: string]: any
}) {
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
  className = '',
}: {
  initialHtml: string
  onChange: (html: string) => void
  placeholder?: string
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

  // Hovered Link Preview State
  const [hoveredLink, setHoveredLink] = useState<{
    url: string
    label: string
    element: HTMLAnchorElement
    top: number
    left: number
  } | null>(null)
  const [editingHoveredUrl, setEditingHoveredUrl] = useState<string | null>(null)
  const linkHoverTimerRef = useRef<NodeJS.Timeout | null>(null)

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
        onInput={handleInput}
        onBlur={handleBlur}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={`focus:outline-none min-h-[28px] empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-600 empty:before:pointer-events-none ${className}`}
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
            className="fixed z-50 flex items-center gap-0.5 bg-[#1C1C1C] border border-white/20 rounded-xl px-1.5 py-1 shadow-2xl backdrop-blur-xl animate-fadeIn text-xs text-white"
            onMouseDown={(e) => e.preventDefault()}
          >
            {showLinkInput ? (
              <form onSubmit={handleInsertLink} className="flex items-center gap-1.5 px-1 py-0.5">
                <Link2 className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  placeholder="https://... atau /layanan"
                  className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400 w-48 font-mono"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-accent-500 text-black font-bold text-xs hover:bg-accent-400 transition-colors"
                >
                  OK
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
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Italic (Ctrl+I / ⌘I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('underline')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Underline (Ctrl+U / ⌘U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('strikeThrough')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-200 hover:text-white transition-colors"
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={() => setShowLinkInput(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-accent-300 hover:text-accent-200 transition-colors flex items-center gap-1 font-semibold"
                  title="Sisipkan Tautan (Ctrl+K / ⌘K)"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('unlink')}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-300 transition-colors"
                  title="Hapus Tautan"
                >
                  <Unlink className="w-3.5 h-3.5" />
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
}: {
  initialHtml: string
  onChange: (html: string) => void
  onEnter?: () => void
  onDeleteIfEmpty?: () => void
  placeholder?: string
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
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className="flex-1 bg-transparent border-0 border-b border-transparent focus:border-white/20 text-xs text-neutral-200 focus:outline-none py-1 min-h-[22px] empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-600 [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_a]:text-accent-400 [&_a]:underline"
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
          <TableIcon className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300 font-mono">Tabel Data (Notion-style)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
            {columnCount} Kolom × {rows.length} Baris
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => onUpdateBlock(block.id, { hasHeaderRow: !hasHeaders })}
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
                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-400 font-semibold text-xs text-white focus:outline-none p-1 placeholder:text-neutral-500"
                      />
                      {columnCount > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="opacity-0 group-hover/th:opacity-100 p-0.5 text-neutral-500 hover:text-red-400 transition-opacity"
                          title="Hapus Kolom"
                        >
                          <Trash2 className="w-3 h-3" />
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
                    />
                  </td>
                ))}
                <td className="w-8 p-1 text-center align-middle border-l border-white/5">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="opacity-0 group-hover/tr:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-opacity"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-3 h-3" />
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

interface ArticleEditorCanvasProps {
  title: string
  onTitleChange: (val: string) => void
  slug: string
  category: string
  categoriesList: Array<{ name: string; slug?: string }>
  onCategoryChange: (cat: string) => void
  editorStyle: 'blocks' | 'raw'
  onEditorStyleChange: (style: 'blocks' | 'raw') => void
  onConvertRawToBlocks?: () => void
  onImportMarkdown?: (markdown: string, useExtractedTitle?: boolean) => void
  onConvertSingleHtmlBlockToBlocks?: (blockId: string) => void
  rawContent: string
  onRawContentChange: (val: string) => void
  blocks: ContentBlock[]
  onAddBlock: (type: BlockType) => void
  onUpdateBlock: (id: string, updated: Partial<ContentBlock>) => void
  onRemoveBlock: (id: string) => void
  onMoveBlock: (index: number, direction: 'up' | 'down') => void
  onConvertBlockType: (blockId: string, targetType: BlockType) => void
  rawHtmlBlockIds: Record<string, boolean>
  onToggleRawHtmlBlock: (blockId: string) => void
  activeTypeDropdownBlockId: string | null
  onSetActiveTypeDropdownBlockId: (id: string | null) => void
  onOpenMediaPickerForBlock: (blockId: string) => void
  isFocusMode: boolean
}

export function ArticleEditorCanvas({
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
  onConvertSingleHtmlBlockToBlocks,
  rawContent,
  onRawContentChange,
  blocks,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  onConvertBlockType,
  rawHtmlBlockIds,
  onToggleRawHtmlBlock,
  activeTypeDropdownBlockId,
  onSetActiveTypeDropdownBlockId,
  onOpenMediaPickerForBlock,
  isFocusMode,
}: ArticleEditorCanvasProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [useExtractedTitle, setUseExtractedTitle] = useState(true)
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null)

  const handleExecuteImport = () => {
    if (!importText.trim()) return
    if (onImportMarkdown) {
      onImportMarkdown(importText, useExtractedTitle)
    } else {
      if (useExtractedTitle) {
        const { title: extractedTitle, content: remainingContent } = extractTitleAndContentFromMarkdown(importText)
        if (extractedTitle) {
          onTitleChange(extractedTitle)
          onRawContentChange(remainingContent || importText)
        } else {
          onRawContentChange(importText)
        }
      } else {
        onRawContentChange(importText)
      }
      onConvertRawToBlocks?.()
    }
    setIsImportModalOpen(false)
    setImportText('')
    setImportSuccessMessage('Format Markdown dari ChatGPT/AI berhasil dikonversi menjadi blok visual!')
    setTimeout(() => setImportSuccessMessage(null), 4000)
  }
  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 scrollbar-thin">
      <div
        className={`mx-auto w-full transition-all duration-300 ${
          isFocusMode ? 'max-w-4xl' : 'max-w-3xl'
        }`}
      >
        {/* Document Header Metadata: Category & URL Slug */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
              Kategori:
            </span>
            <CategoryCombobox
              value={category}
              onChange={onCategoryChange}
              categoriesList={categoriesList}
              variant="canvas"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 truncate max-w-xs sm:max-w-md">
            <span className="text-neutral-600">/artikel/</span>
            <span className="text-accent-400/90 font-medium truncate">{slug || '...'}</span>
          </div>
        </div>

        {/* Title Field: Frameless, Clean, Auto-Resize */}
        <div className="mb-6">
          <AutoResizeTextarea
            value={title}
            onChange={onTitleChange}
            placeholder="Ketik Judul Artikel di Sini..."
            minHeight={48}
            className="w-full bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-white/20 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white placeholder:text-neutral-700 focus:outline-none leading-[1.2] transition-colors font-display pb-3 p-0 focus:ring-0"
          />
        </div>

        {/* Sub-bar: Content Mode Selector (Kanvas Blok vs Raw HTML) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-3 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
              Isi Konten Editorial
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
              {editorStyle === 'blocks' ? `${blocks.length} Blok Visual` : 'Mode Raw HTML / MD'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/25 transition-all shadow-sm cursor-pointer"
              title="Tempel atau impor teks artikel dari ChatGPT / Claude dalam format Markdown"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Impor Markdown (AI)</span>
            </button>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => onEditorStyleChange('blocks')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  editorStyle === 'blocks'
                    ? 'bg-white/15 text-white font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-accent-400" />
                <span>Kanvas Blok</span>
              </button>
              <button
                type="button"
                onClick={() => onEditorStyleChange('raw')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  editorStyle === 'raw'
                    ? 'bg-white/15 text-white font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Raw HTML / MD</span>
              </button>
            </div>
          </div>
        </div>

        {importSuccessMessage && (
          <div className="mb-4 p-3 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-between text-xs text-sky-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportSuccessMessage(null)}
              className="text-sky-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body: Raw HTML or Blocks */}
        {editorStyle === 'raw' ? (
          <div className="space-y-3">
            {/* Conversion Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-400/25">
              <div className="flex items-center gap-2 text-xs text-blue-300">
                <Code className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Mode Raw aktif. Anda dapat menempel Markdown dari ChatGPT atau menulis HTML langsung, lalu klik tombol konversi.</span>
              </div>
              {onConvertRawToBlocks && (
                <button
                  type="button"
                  onClick={onConvertRawToBlocks}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Konversi ke Blok Visual</span>
                </button>
              )}
            </div>

            <textarea
              rows={22}
              value={rawContent}
              onChange={(e) => onRawContentChange(e.target.value)}
              className="w-full font-mono text-xs bg-black/50 border border-white/15 rounded-2xl p-5 text-emerald-300 focus:outline-none focus:border-accent-400 leading-relaxed"
              placeholder={`# Judul Artikel\n## Subjudul Bagian\n\nTempel teks Markdown dari ChatGPT / Claude atau kode HTML artikel di sini...\n\n| Kolom 1 | Kolom 2 |\n|---|---|\n| Nilai 1 | Nilai 2 |`}
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-neutral-500 italic">
                Perubahan pada raw HTML/MD akan otomatis tersinkronisasi saat Anda beralih ke Kanvas Blok atau mengklik &ldquo;Konversi ke Blok Visual&rdquo;.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <div
                key={block.id ? `${block.id}-${idx}` : `block-${idx}`}
                className="relative group rounded-xl py-1.5 px-3 -mx-3 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/5"
              >
                {/* Floating Gutter Controls on Hover */}
                <div className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-10 flex items-center gap-1 bg-[#1A1A1A] border border-white/15 rounded-md px-1.5 py-0.5 shadow-xl text-[10px] text-neutral-300">
                  {/* Type switcher dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSetActiveTypeDropdownBlockId(
                          activeTypeDropdownBlockId === block.id ? null : block.id
                        )
                      }}
                      className="inline-flex items-center gap-1 font-mono uppercase text-neutral-300 hover:text-white text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 font-semibold transition-colors"
                      title="Ubah jenis blok"
                    >
                      {block.type === 'paragraph' && <AlignLeft className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'heading2' && <Heading2 className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'heading3' && <Heading3 className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'quote' && <Quote className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'list' && <List className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'code' && <Code className="w-2.5 h-2.5 text-accent-400" />}
                      {block.type === 'table' && <TableIcon className="w-2.5 h-2.5 text-accent-400" />}
                      <span>{getBlockLabel(block.type)}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-neutral-400" />
                    </button>

                    {activeTypeDropdownBlockId === block.id && (
                      <div
                        className="absolute top-full right-0 mt-1.5 z-50 w-48 p-1 bg-[#1A1A1A]/95 border border-white/10 rounded-xl shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-2.5 py-1 text-[9px] font-mono text-neutral-400 uppercase tracking-wider border-b border-white/[0.06] mb-1">
                          Ubah Jenis Blok
                        </div>
                        {[
                          { type: 'paragraph' as const, label: 'Paragraf (Teks)', icon: AlignLeft },
                          { type: 'heading2' as const, label: 'Subjudul H2', icon: Heading2 },
                          { type: 'heading3' as const, label: 'Subjudul H3', icon: Heading3 },
                          { type: 'quote' as const, label: 'Kutipan (Quote)', icon: Quote },
                          { type: 'list' as const, label: 'Daftar (List)', icon: List },
                          { type: 'code' as const, label: 'Kode Program', icon: Code },
                          { type: 'table' as const, label: 'Tabel (Notion)', icon: TableIcon },
                          { type: 'html' as const, label: 'HTML Kustom', icon: Code },
                        ].map((item) => {
                          const Icon = item.icon
                          const isCurrent = block.type === item.type
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => onConvertBlockType(block.id, item.type)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-sky-500/15 text-sky-300 font-semibold'
                                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-sky-400' : 'text-neutral-400'}`} />
                                <span>{item.label}</span>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-sky-400" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {['paragraph', 'quote', 'list'].includes(block.type) && (
                    <button
                      type="button"
                      onClick={() => onToggleRawHtmlBlock(block.id)}
                      className={`p-0.5 px-1 rounded font-mono text-[9px] transition-colors ${
                        rawHtmlBlockIds[block.id]
                          ? 'bg-accent-500/30 text-accent-300 font-bold'
                          : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title={rawHtmlBlockIds[block.id] ? 'Tampilan Visual' : 'Lihat HTML'}
                    >
                      &lt;/&gt;
                    </button>
                  )}

                  <div className="h-3 w-px bg-white/15 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => onMoveBlock(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-neutral-300"
                    title="Pindah ke Atas"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveBlock(idx, 'down')}
                    disabled={idx === blocks.length - 1}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-neutral-300"
                    title="Pindah ke Bawah"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveBlock(block.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    title="Hapus Blok"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* 1. Paragraph */}
                {block.type === 'paragraph' && (
                  <div>
                    {rawHtmlBlockIds[block.id] ? (
                      <AutoResizeTextarea
                        value={block.text}
                        onChange={(val) => onUpdateBlock(block.id, { text: val })}
                        placeholder="Ketik kode HTML atau paragraf..."
                        minHeight={28}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-emerald-300 placeholder:text-neutral-600 focus:outline-none leading-relaxed"
                      />
                    ) : (
                      <RichContentEditable
                        initialHtml={block.text}
                        onChange={(val) => onUpdateBlock(block.id, { text: val })}
                        placeholder="Mulai ketik paragraf di sini... (Blok teks untuk format atau Cmd/Ctrl+B, Cmd/Ctrl+K)"
                        className="w-full bg-transparent border-0 text-[15px] sm:text-base text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-[1.75] font-sans p-0 focus:ring-0 selection:bg-accent-500/30"
                      />
                    )}
                  </div>
                )}

                {/* 2. Heading 2 */}
                {block.type === 'heading2' && (
                  <div className="relative pt-1 group/h2">
                    {generateHeadingSlug(block.text) && (
                      <span
                        className="absolute -top-2 right-0 text-[10px] font-mono text-neutral-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded select-none opacity-60 group-hover/h2:opacity-100 transition-opacity z-10"
                        title="Anchor ID otomatis untuk TOC & jump links"
                      >
                        #{generateHeadingSlug(block.text)}
                      </span>
                    )}
                    <AutoResizeTextarea
                      value={block.text}
                      onChange={(val) => onUpdateBlock(block.id, { text: val })}
                      placeholder="Subjudul H2..."
                      minHeight={32}
                      className="w-full bg-transparent border-0 text-xl sm:text-2xl font-bold text-white placeholder:text-neutral-600 focus:outline-none leading-snug font-display p-0 focus:ring-0 pr-28"
                    />
                  </div>
                )}

                {/* 3. Heading 3 */}
                {block.type === 'heading3' && (
                  <div className="relative pt-1 group/h3">
                    {generateHeadingSlug(block.text) && (
                      <span
                        className="absolute -top-2 right-0 text-[10px] font-mono text-neutral-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded select-none opacity-60 group-hover/h3:opacity-100 transition-opacity z-10"
                        title="Anchor ID otomatis untuk TOC & jump links"
                      >
                        #{generateHeadingSlug(block.text)}
                      </span>
                    )}
                    <AutoResizeTextarea
                      value={block.text}
                      onChange={(val) => onUpdateBlock(block.id, { text: val })}
                      placeholder="Subjudul H3..."
                      minHeight={28}
                      className="w-full bg-transparent border-0 text-lg sm:text-xl font-semibold text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-snug font-display p-0 focus:ring-0 pr-28"
                    />
                  </div>
                )}

                {/* 4. Image Block */}
                {block.type === 'image' && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Blok Gambar Artikel</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenMediaPickerForBlock(block.id)}
                        className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold transition-colors"
                      >
                        Pilih / Ganti Gambar
                      </button>
                    </div>

                    {block.url && (
                      <div className="relative aspect-[16/9] w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={block.url}
                          alt={block.alt || 'Gambar'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                          Alt Text (Aksesibilitas / SEO)*:
                        </label>
                        <input
                          type="text"
                          value={block.alt || ''}
                          onChange={(e) => onUpdateBlock(block.id, { alt: e.target.value })}
                          placeholder="Deskripsi singkat gambar..."
                          className="w-full rounded-lg bg-black/40 border border-white/10 p-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                          Keterangan / Caption:
                        </label>
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => onUpdateBlock(block.id, { caption: e.target.value })}
                          placeholder="Keterangan gambar..."
                          className="w-full rounded-lg bg-black/40 border border-white/10 p-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Video Block */}
                {block.type === 'video' && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <Video className="w-3.5 h-3.5" />
                      <span>Blok Video Embed</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) =>
                          onUpdateBlock(block.id, {
                            url: e.target.value,
                            embedUrl: extractEmbedUrl(e.target.value),
                          })
                        }
                        placeholder="Tempel URL YouTube / Vimeo (https://youtube.com/watch?v=...)"
                        className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-accent-400"
                      />
                    </div>

                    {block.url && (
                      <div className="aspect-video w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-white/10 bg-black">
                        <iframe
                          src={block.embedUrl || extractEmbedUrl(block.url)}
                          title={block.title || 'Video'}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Quote Block */}
                {block.type === 'quote' && (
                  <div className="border-l-4 border-amber-400 bg-amber-400/[0.04] p-4 rounded-r-xl space-y-2">
                    {rawHtmlBlockIds[block.id] ? (
                      <AutoResizeTextarea
                        value={block.text}
                        onChange={(val) => onUpdateBlock(block.id, { text: val })}
                        placeholder="Ketik kutipan di sini (HTML: <strong>, dll)..."
                        minHeight={32}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-400 leading-relaxed"
                      />
                    ) : (
                      <RichContentEditable
                        initialHtml={block.text}
                        onChange={(val) => onUpdateBlock(block.id, { text: val })}
                        placeholder="Ketik kutipan di sini..."
                        className="text-base sm:text-lg italic text-neutral-100 placeholder:text-neutral-600 focus:outline-none leading-relaxed min-h-[32px] [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white [&_a]:text-accent-400 [&_a]:underline"
                      />
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[11px] font-mono text-neutral-500">—</span>
                      <input
                        type="text"
                        value={block.author || ''}
                        onChange={(e) => onUpdateBlock(block.id, { author: e.target.value })}
                        placeholder="Nama Tokoh / Pakar (Opsional)"
                        className="bg-transparent border-0 text-xs text-amber-300 placeholder:text-neutral-600 focus:outline-none p-0 focus:ring-0 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* 7. List Block */}
                {block.type === 'list' && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                        <List className="w-3.5 h-3.5" />
                        <span>Daftar Poin ({block.ordered ? 'Berurutan 1, 2, 3' : 'Bullet Poin'})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateBlock(block.id, { ordered: !block.ordered })}
                        className="text-[11px] text-accent-400 hover:underline"
                      >
                        Ubah ke {block.ordered ? 'Bullet' : 'Nomor'}
                      </button>
                    </div>

                    <div className="space-y-1.5 pl-2">
                      {block.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-start gap-2 group/item">
                          <span className="text-xs text-neutral-500 font-mono w-4 text-right shrink-0 pt-1">
                            {block.ordered ? `${itemIdx + 1}.` : '•'}
                          </span>
                          {rawHtmlBlockIds[block.id] ? (
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...block.items]
                                newItems[itemIdx] = e.target.value
                                onUpdateBlock(block.id, { items: newItems })
                              }}
                              className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-neutral-200 focus:outline-none focus:border-accent-400"
                              placeholder="Tulis poin (HTML)..."
                            />
                          ) : (
                            <RichListItemEditable
                              initialHtml={item}
                              onChange={(val) => {
                                const newItems = [...block.items]
                                newItems[itemIdx] = val
                                onUpdateBlock(block.id, { items: newItems })
                              }}
                              onEnter={() => {
                                const newItems = [...block.items]
                                newItems.splice(itemIdx + 1, 0, '')
                                onUpdateBlock(block.id, { items: newItems })
                              }}
                              onDeleteIfEmpty={() => {
                                if (block.items.length > 1) {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx)
                                  onUpdateBlock(block.id, { items: newItems })
                                }
                              }}
                              placeholder="Tulis poin..."
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = block.items.filter((_, i) => i !== itemIdx)
                              onUpdateBlock(block.id, { items: newItems.length ? newItems : [''] })
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors opacity-40 group-hover/item:opacity-100"
                            title="Hapus Poin"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onUpdateBlock(block.id, { items: [...block.items, ''] })}
                      className="inline-flex items-center gap-1 text-[11px] text-accent-400 hover:text-accent-300 font-semibold pt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Poin</span>
                    </button>
                  </div>
                )}

                {/* 8. FAQ Block */}
                {block.type === 'faq' && (
                  <div className="rounded-xl border border-teal-500/20 bg-teal-950/10 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>FAQ (Struktur AI Overview / SERP)</span>
                    </div>
                    <input
                      type="text"
                      value={block.question}
                      onChange={(e) => onUpdateBlock(block.id, { question: e.target.value })}
                      placeholder="Pertanyaan (Q)?"
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-accent-400"
                    />
                    <AutoResizeTextarea
                      value={block.answer}
                      onChange={(val) => onUpdateBlock(block.id, { answer: val })}
                      placeholder="Jawaban ringkas dan informatif (A)..."
                      minHeight={40}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-neutral-300 focus:outline-none focus:border-accent-400 leading-relaxed"
                    />
                  </div>
                )}

                {/* 9. Code Block */}
                {block.type === 'code' && (
                  <div className="rounded-xl border border-white/15 bg-black/70 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5 font-mono text-cyan-400">
                        <Code className="w-3.5 h-3.5" />
                        <span>Kode Program</span>
                      </span>
                      <select
                        value={block.language || 'typescript'}
                        onChange={(e) => onUpdateBlock(block.id, { language: e.target.value })}
                        className="bg-white/10 border border-white/15 rounded px-2 py-0.5 text-[11px] font-mono text-white focus:outline-none"
                      >
                        <option value="typescript" className="bg-[#1A1A1A]">TypeScript</option>
                        <option value="javascript" className="bg-[#1A1A1A]">JavaScript</option>
                        <option value="html" className="bg-[#1A1A1A]">HTML</option>
                        <option value="css" className="bg-[#1A1A1A]">CSS</option>
                        <option value="python" className="bg-[#1A1A1A]">Python</option>
                        <option value="bash" className="bg-[#1A1A1A]">Bash / Shell</option>
                        <option value="sql" className="bg-[#1A1A1A]">SQL</option>
                        <option value="json" className="bg-[#1A1A1A]">JSON</option>
                      </select>
                    </div>
                    <textarea
                      rows={5}
                      value={block.code}
                      onChange={(e) => onUpdateBlock(block.id, { code: e.target.value })}
                      className="w-full font-mono text-xs bg-black/50 border border-white/10 rounded-lg p-3 text-cyan-300 focus:outline-none focus:border-accent-400 leading-relaxed"
                      placeholder="// Tulis kode..."
                    />
                  </div>
                )}

                {/* 10. Divider */}
                {block.type === 'divider' && (
                  <div className="py-3 flex items-center justify-center">
                    <div className="h-px w-full bg-white/10" />
                  </div>
                )}

                {/* 11. HTML Block */}
                {block.type === 'html' && (
                  <div className="rounded-xl border border-amber-500/30 bg-black/60 p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-amber-300">Blok HTML Kustom / Impor</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Raw HTML
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onConvertSingleHtmlBlockToBlocks && (
                          <button
                            type="button"
                            onClick={() => onConvertSingleHtmlBlockToBlocks(block.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                            title="Konversi tag HTML di dalam blok ini menjadi blok terpisah (judul, paragraf, list, dll)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pecah Jadi Blok Standar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleRawHtmlBlock(block.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                            rawHtmlBlockIds[block.id]
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {rawHtmlBlockIds[block.id] ? 'Lihat Pratinjau' : 'Edit Kode'}
                        </button>
                      </div>
                    </div>

                    {rawHtmlBlockIds[block.id] ? (
                      <AutoResizeTextarea
                        value={block.html}
                        onChange={(val) => onUpdateBlock(block.id, { html: val })}
                        placeholder="<div>...</div>"
                        minHeight={90}
                        className="w-full bg-black/70 border border-white/10 rounded-lg p-3 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-400 leading-relaxed"
                      />
                    ) : (
                      <div
                        className="prose prose-invert max-w-none text-xs p-3.5 bg-neutral-900/60 rounded-xl border border-white/10 overflow-x-auto text-neutral-300"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.html) }}
                      />
                    )}
                  </div>
                )}

                {/* 12. Internal Links Block */}
                {block.type === 'internal-links' && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          value={block.title || 'Indeks Tautan Internal Terkait (SEO Reference)'}
                          onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
                          placeholder="Judul Grup Tautan Internal..."
                          className="bg-transparent border-0 border-b border-transparent focus:border-emerald-400/50 font-semibold text-xs sm:text-sm text-emerald-300 focus:outline-none w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {block.links?.length || 0} Tautan
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newLinks = [...(block.links || []), { text: '', href: '' }]
                            onUpdateBlock(block.id, { links: newLinks })
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Tautan</span>
                        </button>
                      </div>
                    </div>

                    {(!block.links || block.links.length === 0) ? (
                      <p className="text-xs text-neutral-500 italic py-2 text-center">
                        Belum ada tautan internal. Klik &quot;Tambah Tautan&quot; untuk menyematkan link relevan.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {block.links.map((link, linkIdx) => (
                          <div
                            key={linkIdx}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5 group/link"
                          >
                            <span className="text-xs text-emerald-500 font-mono w-4 text-center shrink-0 hidden sm:inline">
                              •
                            </span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={link.text}
                                onChange={(e) => {
                                  const newLinks = [...block.links]
                                  newLinks[linkIdx] = { ...newLinks[linkIdx], text: e.target.value }
                                  onUpdateBlock(block.id, { links: newLinks })
                                }}
                                placeholder="Teks Tautan (Anchor Text)..."
                                className="w-full bg-transparent border-0 border-b border-transparent focus:border-accent-400 text-xs text-white placeholder:text-neutral-500 focus:outline-none py-1"
                              />
                            </div>
                            <div className="flex-1 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={link.href}
                                onChange={(e) => {
                                  const newLinks = [...block.links]
                                  newLinks[linkIdx] = { ...newLinks[linkIdx], href: e.target.value }
                                  onUpdateBlock(block.id, { links: newLinks })
                                }}
                                placeholder="URL (/layanan/..., https://...)"
                                className="w-full bg-transparent border-0 border-b border-transparent focus:border-accent-400 font-mono text-[11px] text-accent-300 placeholder:text-neutral-500 focus:outline-none py-1"
                              />
                              {link.href && (
                                <a
                                  href={link.href.startsWith('/') ? `${siteConfig.url}${link.href}` : link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-neutral-400 hover:text-white transition-colors shrink-0"
                                  title="Tes Buka Tautan"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = block.links.filter((_, i) => i !== linkIdx)
                                  onUpdateBlock(block.id, { links: newLinks })
                                }}
                                className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                                title="Hapus Tautan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 13. Table Block (Notion-style) */}
                {block.type === 'table' && (
                  <NotionTableEditor
                    block={block}
                    onUpdateBlock={onUpdateBlock}
                  />
                )}
              </div>
            ))}

            {/* Compact Bottom Inserter Bar */}
            <div className="pt-6 mt-6 border-t border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-neutral-500 font-semibold mr-1">
                  + Tambah:
                </span>
                <button
                  type="button"
                  onClick={() => onAddBlock('paragraph')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-accent-400" />
                  <span>Paragraf</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('heading2')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Heading2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Subjudul H2</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('heading3')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Heading3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Subjudul H3</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('image')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('video')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('quote')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Quote className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kutipan</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('list')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <List className="w-3.5 h-3.5 text-purple-400" />
                  <span>Daftar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('faq')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>FAQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('code')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kode</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('html')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  title="Tambah blok HTML kustom"
                >
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  <span>HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('divider')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Garis</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('internal-links')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors"
                  title="Tambah indeks tautan internal SEO"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tautan SEO</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('table')}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1.5 transition-colors"
                  title="Tambah tabel data Notion-style"
                >
                  <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tabel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Markdown Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Impor Dokumen Markdown (ChatGPT / AI)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/20">
                        Auto Parser
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Tempel teks Markdown langsung dari ChatGPT, Claude, atau text editor. Struktur heading, kutipan, daftar poin, dan tabel akan otomatis dipecah menjadi blok visual.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <textarea
                  rows={13}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  autoFocus
                  className="w-full font-mono text-xs bg-black/70 border border-white/15 rounded-xl p-4 text-emerald-300 focus:outline-none focus:border-sky-400 leading-relaxed scrollbar-thin resize-none"
                  placeholder={`# Judul Artikel\n## Subjudul Bagian\n\n> **Kutipan penting.** Penjelasan kutipan...\n\nParagraf penjelasan dengan **tebal** dan [tautan](#link)...\n\n| Jenis Layanan | Cocok Untuk | Fokus Utama |\n|---|---|---|\n| Website Profil | Perusahaan Resmi | Kredibilitas |\n\n1. [Poin Daftar Isi](#poin-1)\n2. [Poin Kedua](#poin-2)`}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useExtractedTitle}
                    onChange={(e) => setUseExtractedTitle(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-sky-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Ambil judul otomatis dari baris pertama <code className="text-[11px] text-sky-300 font-mono"># Judul</code></span>
                </label>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={!importText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Konversi ke Blok Visual</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
