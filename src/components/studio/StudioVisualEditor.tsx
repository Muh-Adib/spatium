'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { History } from 'lucide-react'
import type { BlockIssue, BlockTarget } from '@/lib/blocks/catalog'
import { BlockEditor, type BlockEditorLayout } from './blocks/BlockEditor'
import type { ContextData } from './blocks/BlockPreview'
import { useLocalDraft } from './blocks/hooks'
import { ensureBlockIds, formatIssue, type EditorBlock } from './blocks/model'
import { Button } from './blocks/ui'

export type StudioViewMode = 'canvas' | 'split-preview' | 'full-preview'

/** Block as stored on portfolio / service / solution rows (legacy shape: free-form props). */
export interface StudioBlock {
  id: string
  type: string
  // Stored blocks carry arbitrary, partly legacy properties; consumers narrow per type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface StudioVisualEditorProps {
  blocks: StudioBlock[]
  onChangeBlocks: (newBlocks: StudioBlock[]) => void
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  targetType?: 'department' | 'service' | 'portfolio' | 'solution'
  contextData?: ContextData
  /** Identifies the record for local draft autosave (slug or id). */
  draftId?: string
  onValidationChange?: (isValid: boolean, issues: string[]) => void
  /** canvas = editor only, split-preview = editor + live preview, full-preview = preview only. */
  viewMode?: StudioViewMode
  onSave?: () => void
}

const LAYOUT: Record<StudioViewMode, BlockEditorLayout> = {
  canvas: 'editor',
  'split-preview': 'split',
  'full-preview': 'preview',
}

/**
 * Block editor embedded by the portfolio, service and solution managers.
 * Thin adapter over the catalogue-driven `BlockEditor` that keeps the
 * managers' existing props, adds local draft autosave and reports validation
 * as display strings.
 */
export default function StudioVisualEditor({
  blocks,
  onChangeBlocks,
  selectedBlockId,
  onSelectBlock,
  targetType = 'service',
  contextData,
  draftId,
  onValidationChange,
  viewMode = 'split-preview',
  onSave,
}: StudioVisualEditorProps) {
  const target: BlockTarget = targetType === 'department' ? 'service' : targetType

  // Legacy rows may lack ids; the editor needs a stable, unique id per block.
  const normalized = useMemo(() => ensureBlockIds(blocks), [blocks])
  useEffect(() => {
    if (normalized !== blocks) onChangeBlocks(normalized as StudioBlock[])
  }, [normalized, blocks, onChangeBlocks])

  // Local draft autosave per record; the baseline is what was loaded.
  const draftKey = draftId ? `spatium:block-draft:${target}:${draftId}` : null
  const [baseline, setBaseline] = useState<EditorBlock[]>(normalized)
  const baselineKey = useRef(draftKey)
  if (baselineKey.current !== draftKey) {
    baselineKey.current = draftKey
    setBaseline(normalized)
  }
  const draft = useLocalDraft<EditorBlock[]>(draftKey, normalized, baseline)

  const lastReported = useRef('')
  const handleIssues = useCallback(
    (issues: BlockIssue[]) => {
      const messages = issues.map((i) => formatIssue(i, normalized))
      const key = JSON.stringify(messages)
      if (key === lastReported.current) return
      lastReported.current = key
      onValidationChange?.(messages.length === 0, messages)
    },
    [normalized, onValidationChange],
  )

  const notice = draft.recoverable ? (
    <div role="status" className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
      <p className="flex items-start gap-2">
        <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Ada draf blok yang belum disimpan dari {new Date(draft.recoverable.savedAt).toLocaleString('id-ID')}.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            const stored = draft.recoverable
            if (stored) onChangeBlocks(ensureBlockIds(stored.value) as StudioBlock[])
            draft.dismiss()
          }}
        >
          Pulihkan draf
        </Button>
        <Button size="sm" onClick={draft.clear}>
          Buang draf
        </Button>
      </div>
    </div>
  ) : null

  return (
    <BlockEditor
      target={target}
      blocks={normalized}
      onChange={(next) => onChangeBlocks(next as StudioBlock[])}
      selectedId={selectedBlockId}
      onSelect={onSelectBlock}
      onIssuesChange={handleIssues}
      onSave={onSave}
      layout={LAYOUT[viewMode]}
      contextData={contextData}
      notice={notice}
      label="Blok"
    />
  )
}
