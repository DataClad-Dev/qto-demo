import { useState } from "react"
import type { Drawing } from "../../lib/types"

interface LayersTreeProps {
  drawings: Drawing[]
  activeDrawingId: string | null
  onSelect: (id: string) => void
}

const DISCIPLINE_ORDER = ["Architecture", "Structure", "Interior Design"] as const
const DEFAULT_EXPANDED = new Set<string>(["Structure"])

/**
 * Left "Drawing Set" tree — groups drawings by discipline, collapsible sections,
 * active sheet gets the indigo left-border highlight from the locked mockup.
 */
export function LayersTree({ drawings, activeDrawingId, onSelect }: LayersTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(DEFAULT_EXPANDED))

  const byDiscipline = new Map<string, Drawing[]>()
  for (const d of drawings) {
    const list = byDiscipline.get(d.discipline) ?? []
    list.push(d)
    byDiscipline.set(d.discipline, list)
  }

  const disciplines = [
    ...DISCIPLINE_ORDER.filter((d) => byDiscipline.has(d)),
    ...[...byDiscipline.keys()].filter((d) => !DISCIPLINE_ORDER.includes(d as (typeof DISCIPLINE_ORDER)[number])),
  ]

  function toggle(discipline: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(discipline)) next.delete(discipline)
      else next.add(discipline)
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-panel py-2 text-[11px]">
      <div className="px-2.5 py-0.5 text-[9px] uppercase tracking-wide text-faint">Drawing Set</div>
      {disciplines.map((discipline) => {
        const sheets = byDiscipline.get(discipline) ?? []
        const isOpen = expanded.has(discipline)
        return (
          <div key={discipline}>
            <button
              type="button"
              onClick={() => toggle(discipline)}
              className={
                isOpen
                  ? "flex w-full items-center gap-1 bg-accent-soft px-2.5 py-1 pl-5 text-left font-semibold text-accent"
                  : "flex w-full items-center gap-1 px-2.5 py-1 text-left text-muted hover:text-ink"
              }
            >
              <span className="w-2.5 text-[9px]">{isOpen ? "▾" : "▸"}</span>
              <span className="truncate">{discipline}</span>
              <span className="ml-auto text-faint">{sheets.length}</span>
            </button>
            {isOpen &&
              sheets.map((sheet) => {
                const isActive = sheet.id === activeDrawingId
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => onSelect(sheet.id)}
                    title={sheet.fileName}
                    className={
                      isActive
                        ? "block w-full truncate border-l-2 border-accent bg-accent-soft-strong py-[3px] pl-8 pr-2.5 text-left text-ink"
                        : "block w-full truncate border-l-2 border-transparent py-[3px] pl-8 pr-2.5 text-left text-muted hover:bg-line-soft/40 hover:text-ink"
                    }
                  >
                    {sheet.sheetCode || sheet.title}
                  </button>
                )
              })}
          </div>
        )
      })}
    </div>
  )
}
