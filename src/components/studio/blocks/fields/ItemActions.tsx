'use client'

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { IconButton } from '../ui'

/** Up / down / remove controls for one item of a repeatable field. */
export function ItemActions({ index, count, itemName, onMove, onRemove }: { index: number; count: number; itemName: string; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center" role="group" aria-label={`Tindakan ${itemName}`}>
      <IconButton icon={ArrowUp} size="sm" label={`Naikkan ${itemName}`} disabled={index === 0} onClick={() => onMove(index - 1)} />
      <IconButton icon={ArrowDown} size="sm" label={`Turunkan ${itemName}`} disabled={index === count - 1} onClick={() => onMove(index + 1)} />
      <IconButton icon={Trash2} size="sm" tone="danger" label={`Hapus ${itemName}`} onClick={onRemove} />
    </div>
  )
}
