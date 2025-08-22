'use client'
import { useState } from 'react'
import type { DocItem } from '../lib/docsState'

const SLOT_LABELS = [
  { type: 'prd' as const, label: 'PRD' },
  { type: 'estimate' as const, label: 'Financial/Time Estimate' },
  { type: 'other' as const, label: 'Supporting Doc 1' },
  { type: 'other' as const, label: 'Supporting Doc 2' },
  { type: 'other' as const, label: 'Supporting Doc 3' }
]

export default function DocsUploader({
  docs,
  setDocs
}: {
  docs: (DocItem | null)[]
  setDocs: (d: (DocItem | null)[]) => void
}) {
  const [open, setOpen] = useState(true)
  function handleFile(idx: number, file: File) {
    const next = [...docs]
    next[idx] = { file, name: file.name, type: SLOT_LABELS[idx].type }
    setDocs(next)
  }

  function handleName(idx: number, name: string) {
    const next = [...docs]
    if (next[idx]) next[idx]!.name = name
    setDocs(next)
  }

  function handleDelete(idx: number) {
    const next = [...docs]
    next[idx] = null
    setDocs(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Supporting Documents</h2>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-xs text-emerald-400"
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <div className="grid gap-4">
          {SLOT_LABELS.map((slot, idx) => {
            const item = docs[idx]
            return (
              <div
                key={idx}
              className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/40"
            >
              {item ? (
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-transparent border-b border-zinc-700 focus:outline-none text-sm"
                    value={item.name}
                    onChange={e => handleName(idx, e.target.value)}
                  />
                  <button
                    onClick={() => handleDelete(idx)}
                    className="text-xs bg-zinc-800 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-12 cursor-pointer rounded bg-zinc-800 text-sm">
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.markdown,.pdf,.doc,.docx,.rtf,.csv,.json"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(idx, file)
                    }}
                  />
                  <span>Upload {slot.label}</span>
                </label>
              )}
            </div>
          )
        })}
        </div>
      )}
      <p className="text-xs text-zinc-400">
        {docs.filter(Boolean).length}/5 files uploaded
      </p>
    </div>
  )
}
