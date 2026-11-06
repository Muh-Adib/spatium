'use client'

import { ArrowRight, ShieldAlert } from 'lucide-react'
import { EditorDialog, dialogButton } from './EditorDialog'

export interface GateIssue {
  message: string
  /** Gate field key from `checkPublicationGate` (e.g. `slug`, `heroVisual.altText`, `images[0].altText`). */
  field?: string
}

interface ArticlePublicationGateModalProps {
  issues: GateIssue[]
  onClose: () => void
  /** Close the dialog and move focus to the field that has to be fixed. */
  onFixField: (field: string) => void
  fieldLabel: (field: string) => string | null
}

export function ArticlePublicationGateModal({ issues, onClose, onFixField, fieldLabel }: ArticlePublicationGateModalProps) {
  return (
    <EditorDialog
      open={issues.length > 0}
      onClose={onClose}
      size="md"
      icon={<ShieldAlert className="h-5 w-5 text-rose-300" />}
      title="Artikel belum bisa diterbitkan"
      description={`Perbaiki ${issues.length} syarat berikut, lalu terbitkan lagi. Pilih sebuah masalah untuk langsung menuju kolomnya.`}
      footer={
        <button type="button" onClick={onClose} className={dialogButton.secondary}>
          Tutup
        </button>
      }
    >
      <ol className="space-y-2 text-xs">
        {issues.map((issue, i) => {
          const label = issue.field ? fieldLabel(issue.field) : null
          return (
            <li key={`${issue.field ?? 'issue'}-${i}`} className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="leading-relaxed text-rose-100">{issue.message}</p>
              {issue.field && label && (
                <button
                  type="button"
                  onClick={() => onFixField(issue.field ?? '')}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2 hover:text-accent-300"
                >
                  <span>Perbaiki: {label}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </EditorDialog>
  )
}
