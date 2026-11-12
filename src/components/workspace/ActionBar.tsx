import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useWorkspaceStore } from "../../lib/store"
import type { EnrichedBoqItem, ReviewAction } from "../../lib/types"

const ACTION_LABEL: Record<string, string> = {
  accept: "Accepted",
  revise: "Revised",
  comment: "Comment",
  assumption: "Assumption",
}

const EMPTY_ACTIONS: ReviewAction[] = []

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2.2 6.2 4.8 8.8 9.8 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d="M8 1.8 10.2 4 4 10.2 1.5 10.5 1.8 8 8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ActionBar({ item }: { item: EnrichedBoqItem }) {
  const addAction = useWorkspaceStore((s) => s.addAction)
  const estimatorStatus = useWorkspaceStore((s) => s.estimatorStatusByItem[item.id] ?? "pending")
  const actions = useWorkspaceStore((s) => s.actionsByItem[item.id] ?? EMPTY_ACTIONS)

  const [mode, setMode] = useState<"revise" | "comment" | "assumption" | null>(null)
  const [note, setNote] = useState("")
  const [revisedQty, setRevisedQty] = useState(String(item.aiQuantity))
  const [justAccepted, setJustAccepted] = useState(false)

  function accept() {
    addAction(item.id, { type: "accept" })
    setJustAccepted(true)
    setTimeout(() => setJustAccepted(false), 900)
  }

  function submit() {
    if (mode === "revise") {
      addAction(item.id, { type: "revise", revisedQty: Number(revisedQty), note: note || undefined })
    } else if (mode) {
      addAction(item.id, { type: mode, note })
    }
    setMode(null)
    setNote("")
  }

  return (
    <div className="border-t border-line-soft px-2.5 py-2.5 text-[11px]">
      <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-wide text-faint">
        <span>Estimator Action</span>
        <span
          className={`font-mono normal-case transition-colors ${
            estimatorStatus === "accepted" ? "text-matched" : estimatorStatus === "revised" ? "text-flagged" : "text-muted"
          }`}
        >
          {estimatorStatus}
        </span>
      </div>

      <div data-tour="estimator-actions" className="flex gap-1.5">
        <button
          onClick={accept}
          className="relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded border border-matched bg-matched-soft py-1 font-medium text-matched transition-transform hover:brightness-95 active:scale-[0.98]"
        >
          <span className={justAccepted ? "animate-check-pop" : ""}>
            <CheckIcon />
          </span>
          Accept
        </button>
        <button
          onClick={() => setMode(mode === "revise" ? null : "revise")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-flagged bg-flagged-soft py-1 font-medium text-flagged transition-transform hover:brightness-95 active:scale-[0.98]"
        >
          <PencilIcon />
          Revise
        </button>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <button
          onClick={() => setMode(mode === "comment" ? null : "comment")}
          className="flex-1 rounded border border-line py-1 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Add comment
        </button>
        <button
          onClick={() => setMode(mode === "assumption" ? null : "assumption")}
          className="flex-1 rounded border border-line py-1 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Add assumption
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 rounded border border-line-soft bg-panel p-2">
              {mode === "revise" && (
                <label className="flex items-center gap-1.5">
                  <span className="text-faint">Qty</span>
                  <input
                    value={revisedQty}
                    onChange={(e) => setRevisedQty(e.target.value)}
                    className="w-24 rounded border border-line bg-white px-1.5 py-0.5 font-mono outline-none focus:border-accent"
                  />
                  <span className="text-faint">{item.unit}</span>
                </label>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === "revise" ? "Reason for revision (optional)" : "Note…"}
                className="w-full rounded border border-line bg-white p-1.5 text-[11px] outline-none focus:border-accent"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setMode(null)} className="rounded px-2 py-1 text-faint hover:text-ink">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="rounded bg-accent px-2 py-1 font-medium text-white transition-colors hover:bg-accent/90"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {actions.length > 0 && (
        <div className="mt-3 border-t border-line-soft pt-2">
          <div className="mb-1 text-[9px] uppercase tracking-wide text-faint">Audit Timeline</div>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {[...actions].reverse().map((a) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="border-l-2 border-line-soft pl-2"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-ink">{ACTION_LABEL[a.type] ?? a.type}</span>
                    <span className="font-mono text-[9px] text-faint">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {a.revisedQty !== undefined && (
                    <div className="font-mono text-[10px] text-muted">
                      → {a.revisedQty} {item.unit}
                    </div>
                  )}
                  {a.note && <div className="text-muted">{a.note}</div>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  )
}
