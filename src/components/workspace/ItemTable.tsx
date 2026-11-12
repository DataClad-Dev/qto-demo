import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useWorkspaceStore } from "../../lib/store"
import type { EnrichedBoqItem } from "../../lib/types"
import { formatConfidence, formatQty } from "../../lib/format"
import { InfoTooltip } from "../tooltip/InfoTooltip"

type SortKey = "sheet" | "pomiCode" | "quantity" | "aiConfidence"

const STATUS_DOT: Record<EnrichedBoqItem["status"], string> = {
  matched: "bg-matched",
  flagged: "bg-flagged",
  missing: "bg-missing",
}

interface ItemTableProps {
  selectedItemId: string | null
  onSelect: (id: string) => void
  tradeFilter?: string
  onCollapse?: () => void
}

export function ItemTable({ selectedItemId, onSelect, tradeFilter, onCollapse }: ItemTableProps) {
  const items = useWorkspaceStore((s) => s.items)
  const estimatorStatusByItem = useWorkspaceStore((s) => s.estimatorStatusByItem)
  const filters = useWorkspaceStore((s) => s.filters)
  const setFilters = useWorkspaceStore((s) => s.setFilters)
  const [sortKey, setSortKey] = useState<SortKey>("sheet")
  const [sortAsc, setSortAsc] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const prevStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const prev = prevStatusRef.current
    const justConfirmed = Object.keys(estimatorStatusByItem).filter(
      (id) => estimatorStatusByItem[id] !== prev[id] && estimatorStatusByItem[id] !== "pending"
    )
    prevStatusRef.current = estimatorStatusByItem
    if (justConfirmed.length === 0) return
    setConfirmedIds((s) => new Set([...s, ...justConfirmed]))
    const t = setTimeout(() => {
      setConfirmedIds((s) => {
        const next = new Set(s)
        justConfirmed.forEach((id) => next.delete(id))
        return next
      })
    }, 1100)
    return () => clearTimeout(t)
  }, [estimatorStatusByItem])

  const rows = useMemo(() => {
    let result = items
    if (tradeFilter) result = result.filter((i) => i.sheet === tradeFilter)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (i) => i.pomiCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      )
    }
    if (filters.needsReviewOnly) {
      result = result.filter((i) => i.status !== "matched" || i.aiConfidence < 80)
    }
    return [...result].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === "quantity") return (a.quantity - b.quantity) * dir
      if (sortKey === "aiConfidence") return (a.aiConfidence - b.aiConfidence) * dir
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir
    })
  }, [items, tradeFilter, filters, estimatorStatusByItem, sortKey, sortAsc])

  const groups = useMemo(() => {
    const result: { key: string; label: string; items: EnrichedBoqItem[] }[] = []
    for (const item of rows) {
      const last = result[result.length - 1]
      if (last && last.label === item.sheet) last.items.push(item)
      else result.push({ key: `${item.sheet}-${result.length}`, label: item.sheet, items: [item] })
    }
    return result
  }, [rows])

  const allCollapsed = groups.length > 0 && groups.every((g) => collapsedGroups.has(g.key))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAllGroups() {
    setCollapsedGroups(allCollapsed ? new Set() : new Set(groups.map((g) => g.key)))
  }

  return (
    <div className="flex h-full flex-col border-r border-line">
      <div className="flex items-center gap-2 border-b border-line-soft bg-panel px-2.5 py-1.5">
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            title="Collapse panel"
            className="flex shrink-0 items-center justify-center rounded p-1 text-muted outline-none hover:bg-line-soft hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="rotate-90">
              <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Search POMI code or description…"
          className="flex-1 rounded border border-line bg-white px-2 py-1 text-[11px] outline-none focus:border-accent"
        />
        <span data-tour="needs-review" className="flex items-center">
          <button
            type="button"
            onClick={() => setFilters({ needsReviewOnly: !filters.needsReviewOnly })}
            className={
              filters.needsReviewOnly
                ? "flex items-center whitespace-nowrap rounded bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent outline-none focus-visible:ring-1 focus-visible:ring-accent"
                : "flex items-center whitespace-nowrap rounded border border-line px-2 py-1 text-[11px] text-muted outline-none hover:border-accent hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
            }
          >
            Needs Review
          </button>
          <InfoTooltip term="needsReview" />
        </span>
        <button
          type="button"
          onClick={toggleAllGroups}
          className="whitespace-nowrap rounded border border-line px-2 py-1 text-[11px] text-muted outline-none hover:border-accent hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
        >
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
        <span className="whitespace-nowrap font-mono text-[10px] text-faint">{rows.length} rows</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-line-soft text-left text-[9px] uppercase tracking-wide text-faint">
              <th className="w-4 px-2 py-1.5"></th>
              <Th label="Trade" onClick={() => toggleSort("sheet")} />
              <th className="cursor-pointer select-none px-2 py-1.5 hover:text-ink" onClick={() => toggleSort("pomiCode")}>
                <span className="inline-flex items-center">
                  Item (POMI)
                  <InfoTooltip term="pomiCode" />
                </span>
              </th>
              <th className="px-1.5 py-1.5">Location</th>
              <th className="px-1.5 py-1.5">Dwg Ref</th>
              <th className="px-1.5 py-1.5">Measurement</th>
              <Th label="Qty" onClick={() => toggleSort("quantity")} align="right" />
              <Th label="Conf." onClick={() => toggleSort("aiConfidence")} align="right" />
              <th className="px-1.5 py-1.5">Est. Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const collapsed = collapsedGroups.has(group.key)
              return (
                <Fragment key={group.key}>
                  <tr
                    onClick={() => toggleGroup(group.key)}
                    className="cursor-pointer border-b border-line-soft bg-panel hover:bg-line-soft"
                  >
                    <td className="px-2 py-1.5" colSpan={2}>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          className={`shrink-0 text-muted transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
                        >
                          <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {group.label}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-mono text-[10px] text-faint" colSpan={7}>
                      {group.items.length} {group.items.length === 1 ? "row" : "rows"}
                    </td>
                  </tr>
                  {!collapsed &&
                    group.items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={`cursor-pointer border-b border-line-soft transition-colors duration-150 ${
                          confirmedIds.has(item.id)
                            ? "animate-row-confirm"
                            : item.id === selectedItemId
                              ? "bg-accent-soft"
                              : "hover:bg-panel"
                        }`}
                      >
                        <td className="px-2 py-1">
                          <span
                            className={`block h-1.5 w-1.5 rounded-full ${STATUS_DOT[item.status]} ${
                              confirmedIds.has(item.id) ? "animate-check-pop" : ""
                            }`}
                          />
                        </td>
                        <td className="px-1.5 py-1 text-muted">{item.sheet}</td>
                        <td className="px-1.5 py-1 font-mono text-accent">{item.pomiCode}</td>
                        <td className="max-w-[130px] truncate px-1.5 py-1 text-muted" title={[item.level1, item.level2, item.level3].filter(Boolean).join(" / ")}>
                          {[item.level1, item.level2, item.level3].filter(Boolean).join(" / ")}
                        </td>
                        <td className="px-1.5 py-1 font-mono text-[10px] text-muted">{item.drawingRef ?? "—"}</td>
                        <td className="max-w-[160px] truncate px-1.5 py-1 text-ink" title={item.description}>
                          {item.description}
                        </td>
                        <td className="px-1.5 py-1 text-right font-mono">{formatQty(item.quantity, item.unit)}</td>
                        <td className="px-1.5 py-1 text-right font-mono">{formatConfidence(item.aiConfidence)}</td>
                        <td
                          className={`px-1.5 py-1 ${
                            estimatorStatusByItem[item.id] === "accepted"
                              ? "font-medium text-matched"
                              : estimatorStatusByItem[item.id] === "revised"
                                ? "font-medium text-flagged"
                                : "text-muted"
                          }`}
                        >
                          {estimatorStatusByItem[item.id] ?? "pending"}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ label, onClick, align }: { label: string; onClick: () => void; align?: "right" }) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-2 py-1.5 hover:text-ink ${align === "right" ? "text-right" : ""}`}
    >
      {label}
    </th>
  )
}
