import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Drawing, EnrichedBoqItem } from "../../lib/types"

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  drawings: Drawing[]
  boqItems: EnrichedBoqItem[]
  onJumpToDrawing: (id: string) => void
  onJumpToItem: (id: string) => void
}

type Result =
  | { kind: "drawing"; id: string; primary: string; secondary: string }
  | { kind: "item"; id: string; primary: string; secondary: string }

const MAX_RESULTS = 8

/**
 * ⌘K-style command palette — modal overlay + text input, substring-filters
 * drawings (sheetCode/title) and BOQ items (pomiCode/description).
 * Does NOT own the global keydown listener — App.tsx wires ⌘K and passes
 * `open`/`onClose` down.
 */
export function CommandPalette({
  open,
  onClose,
  drawings,
  boqItems,
  onJumpToDrawing,
  onJumpToItem,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setHighlight(0)
      // focus after mount
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const drawingResults: Result[] = drawings
      .filter((d) => d.sheetCode.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
      .map((d) => ({
        kind: "drawing" as const,
        id: d.id,
        primary: d.sheetCode,
        secondary: `${d.discipline} · ${d.title}`,
      }))

    const itemResults: Result[] = boqItems
      .filter((i) => i.pomiCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
      .map((i) => ({
        kind: "item" as const,
        id: i.id,
        primary: i.pomiCode,
        secondary: i.description,
      }))

    return [...drawingResults, ...itemResults].slice(0, MAX_RESULTS * 2)
  }, [query, drawings, boqItems])

  function commit(result: Result) {
    if (result.kind === "drawing") onJumpToDrawing(result.id)
    else onJumpToItem(result.id)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const result = results[highlight]
      if (result) commit(result)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/30 pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-md border border-line bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="text-faint">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlight(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a drawing sheet or BOQ item…"
            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <span className="text-[10px] text-faint">Esc</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() === "" && (
            <div className="px-3 py-6 text-center text-[11px] text-faint">
              Search by sheet code, drawing title, POMI code, or description
            </div>
          )}
          {query.trim() !== "" && results.length === 0 && (
            <div className="px-3 py-6 text-center text-[11px] text-faint">No matches for "{query}"</div>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.kind}-${result.id}`}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => commit(result)}
              className={
                i === highlight
                  ? "flex w-full flex-col items-start gap-0.5 border-l-2 border-accent bg-accent-soft px-3 py-1.5 text-left"
                  : "flex w-full flex-col items-start gap-0.5 border-l-2 border-transparent px-3 py-1.5 text-left hover:bg-panel"
              }
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink">
                <span className="rounded-[2px] bg-line-soft px-1 text-[9px] uppercase tracking-wide text-muted">
                  {result.kind === "drawing" ? "sheet" : "item"}
                </span>
                {result.primary}
              </span>
              <span className="truncate text-[11px] text-muted">{result.secondary}</span>
            </button>
          ))}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
