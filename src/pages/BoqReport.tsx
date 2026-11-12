import { Fragment, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { PageNav } from "../components/chrome/PageNav"
import { useWorkspaceStore } from "../lib/store"
import { COVERAGE_NOTES, DEFAULT_COVERAGE_NOTE } from "../lib/coverageNotes"
import { formatQty, formatConfidence, formatVariance, formatPct, formatAed } from "../lib/format"
import type { EnrichedBoqItem } from "../lib/types"

const STATUS_LABEL: Record<EnrichedBoqItem["status"], string> = {
  matched: "Matched",
  flagged: "Flagged",
  missing: "Missing",
}

const STATUS_BADGE: Record<EnrichedBoqItem["status"], string> = {
  matched: "border-matched bg-matched-soft text-matched",
  flagged: "border-flagged bg-flagged-soft text-flagged",
  missing: "border-missing bg-missing-soft text-missing",
}

const ZOOM_LEVELS = [90, 100, 110, 125] as const

const TH = "sticky top-0 z-20 whitespace-nowrap border-b border-r border-line-soft bg-panel px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-faint"
const TH_NUM = TH + " sticky left-0 z-30 w-9 text-center"
const TH_FROZEN = TH + " sticky left-9 z-20"
const TD = "border-b border-r border-line-soft px-2 py-1.5 align-top"
const TD_NUM = "sticky left-0 z-10 w-9 border-b border-r border-line-soft px-1 py-1.5 text-center align-top font-mono text-[11px] text-faint"
const TD_FROZEN = "sticky left-9 z-10 border-b border-r border-line-soft px-2 py-1.5 align-top"

function reasonDetail(item: EnrichedBoqItem): string {
  const parts: string[] = []
  if (item.reasoning && item.reasoning.length > 0) parts.push(item.reasoning[0])
  if (item.methodology) parts.push(item.methodology)
  return parts.length > 0 ? parts.join(" — ") : "—"
}

function levelBreadcrumb(item: EnrichedBoqItem): string {
  const parts = [item.level1, item.level2, item.level3].filter((p): p is string => Boolean(p))
  return parts.length > 0 ? parts.join(" / ") : "—"
}

function formatItemNo(item: EnrichedBoqItem): string {
  return item.itemNo === null || item.itemNo === undefined ? "—" : String(item.itemNo)
}

function computeAmounts(item: EnrichedBoqItem): { aiAmount: number | null; costVariance: number | null } {
  if (item.rateAed === null) return { aiAmount: null, costVariance: null }
  const aiAmount = item.aiQuantity * item.rateAed
  const boqAmount = item.amountAed ?? item.quantity * item.rateAed
  return { aiAmount, costVariance: aiAmount - boqAmount }
}

function zebra(idx: number): string {
  return idx % 2 === 0 ? "bg-white" : "bg-panel/40"
}

interface TradeGroup {
  sheet: string
  rows: EnrichedBoqItem[]
  total: number
  matched: number
  flagged: number
  missing: number
  avgConfidence: number
  netVariance: number
}

function ReasonHoverCard({ text, children }: { text: string; children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function handleEnter() {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left })
  }

  return (
    <span
      ref={anchorRef}
      className="block"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[999] w-80 max-w-[60vw] rounded-lg border border-line bg-white p-3 text-[18px] normal-case leading-snug text-ink shadow-lg"
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  )
}

function ToolbarMockButton({ title, children }: { title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      className="flex cursor-not-allowed items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-faint opacity-70 first:pl-2.5 last:pr-2.5"
    >
      {children}
    </button>
  )
}

const EXPORT_FORMATS = [
  { id: "csv", label: "CSV" },
  { id: "pdf", label: "PDF" },
  { id: "excel", label: "Excel" },
] as const

function ExportMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted hover:border-accent hover:text-accent"
      >
        Export
        <svg width="8" height="8" viewBox="0 0 8 8">
          <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-36 rounded-lg border border-line bg-white py-1 text-[11px] normal-case shadow-lg">
            {EXPORT_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOpen(false)}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-panel"
              >
                Export as {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SheetToolbar({
  zoom,
  onZoomOut,
  onZoomIn,
  extra,
}: {
  zoom: number
  onZoomOut: () => void
  onZoomIn: () => void
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-b-0 border-line bg-panel px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex divide-x divide-line overflow-hidden rounded border border-line bg-white">
          <ToolbarMockButton title="Sort by column (coming soon)">
            <span aria-hidden>⇅</span> Sort
          </ToolbarMockButton>
          <ToolbarMockButton title="Filter rows (coming soon)">
            <span aria-hidden>⏷</span> Filter
          </ToolbarMockButton>
          <ToolbarMockButton title="Freeze panes — row #s and first column are already pinned">
            <span aria-hidden>▦</span> Freeze
          </ToolbarMockButton>
        </div>

        <div className="flex items-center divide-x divide-line overflow-hidden rounded border border-line bg-white">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
            aria-label="Zoom out"
            className="px-2 py-1.5 text-[11px] font-medium text-muted hover:bg-panel hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            −
          </button>
          <span className="w-11 select-none text-center font-mono text-[10px] text-muted">{zoom}%</span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            aria-label="Zoom in"
            className="px-2 py-1.5 text-[11px] font-medium text-muted hover:bg-panel hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <button
          type="button"
          onClick={() => window.print()}
          title="Print this report"
          className="flex items-center gap-1 rounded border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted hover:border-accent hover:text-accent"
        >
          Print
        </button>
      </div>
    </div>
  )
}

export default function BoqReport() {
  const items = useWorkspaceStore((s) => s.items)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [tradeOverrides, setTradeOverrides] = useState<Record<string, boolean>>({})
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [summaryZoom, setSummaryZoom] = useState<number>(100)
  const [tradeZoom, setTradeZoom] = useState<number>(100)

  const trades = useMemo<TradeGroup[]>(() => {
    const bySheet = new Map<string, EnrichedBoqItem[]>()
    for (const item of items) {
      const arr = bySheet.get(item.sheet) ?? []
      arr.push(item)
      bySheet.set(item.sheet, arr)
    }
    return Array.from(bySheet.entries())
      .map(([sheet, rows]) => {
        const matched = rows.filter((r) => r.status === "matched").length
        const flagged = rows.filter((r) => r.status === "flagged").length
        const missing = rows.filter((r) => r.status === "missing").length
        const avgConfidence = rows.reduce((sum, r) => sum + r.aiConfidence, 0) / rows.length
        const netVariance = rows.reduce((sum, r) => sum + r.variance, 0)
        return { sheet, rows, total: rows.length, matched, flagged, missing, avgConfidence, netVariance }
      })
      .sort((a, b) => b.total - a.total)
  }, [items])

  const discrepancies = useMemo(() => {
    return items
      .filter((i) => i.status !== "matched")
      .sort((a, b) => Math.abs(b.variancePct) - Math.abs(a.variancePct))
  }, [items])

  const totals = useMemo(() => {
    const matched = items.filter((i) => i.status === "matched").length
    const flagged = items.filter((i) => i.status === "flagged").length
    const missing = items.filter((i) => i.status === "missing").length
    const netVariance = items.reduce((sum, i) => sum + i.variance, 0)
    return { total: items.length, matched, flagged, missing, netVariance }
  }, [items])

  function isTradeExpanded(t: TradeGroup): boolean {
    const override = tradeOverrides[t.sheet]
    if (override !== undefined) return override
    return t.flagged > 0 || t.missing > 0
  }

  function toggleTrade(t: TradeGroup) {
    setTradeOverrides((prev) => ({ ...prev, [t.sheet]: !isTradeExpanded(t) }))
    setExpandedItem(null)
  }

  function expandAll() {
    setTradeOverrides(Object.fromEntries(trades.map((t) => [t.sheet, true])))
  }

  function collapseAll() {
    setTradeOverrides(Object.fromEntries(trades.map((t) => [t.sheet, false])))
    setExpandedItem(null)
  }

  function stepZoom(setter: (fn: (z: number) => number) => void, dir: 1 | -1) {
    setter((z) => {
      const idx = ZOOM_LEVELS.indexOf(z as (typeof ZOOM_LEVELS)[number])
      const next = ZOOM_LEVELS[Math.min(Math.max(idx + dir, 0), ZOOM_LEVELS.length - 1)]
      return next
    })
  }

  return (
    <div>
      <PageNav />
      <div className="px-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">
              BOQ Reconciliation Report · Generated {new Date().toLocaleDateString()}
            </div>
            <h1 className="text-2xl font-semibold text-ink">Villa Type C — AI Estimate vs Client BOQ</h1>
            <p className="mt-1 text-sm text-muted">
              {totals.total.toLocaleString()} line items across {trades.length} trades · {totals.matched} matched ·{" "}
              {totals.flagged} flagged · {totals.missing} missing · net qty variance {formatVariance(totals.netVariance)}
            </p>
          </div>
          <ExportMenu />
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Reconciliation Summary</h2>
          <p className="mt-1 text-xs text-muted">
            All flagged and missing items across every trade, sorted by variance magnitude.
          </p>

          <SheetToolbar zoom={summaryZoom} onZoomOut={() => stepZoom(setSummaryZoom, -1)} onZoomIn={() => stepZoom(setSummaryZoom, 1)} />
          <div className="max-h-[560px] overflow-auto border border-line bg-white">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  <th className={TH_NUM}>#</th>
                  <th className={TH_FROZEN}>Trade</th>
                  <th className={TH}>Item No</th>
                  <th className={TH}>POMI</th>
                  <th className={TH}>Level</th>
                  <th className={TH}>Bill File</th>
                  <th className={TH}>Description</th>
                  <th className={TH + " text-right"}>BOQ Qty</th>
                  <th className={TH + " text-right"}>AI Qty</th>
                  <th className={TH + " text-right"}>Variance</th>
                  <th className={TH + " text-right"}>Var %</th>
                  <th className={TH + " text-right"}>Rate AED</th>
                  <th className={TH + " text-right"}>BOQ Amount</th>
                  <th className={TH + " text-right"}>AI Amount</th>
                  <th className={TH + " text-right"}>Cost Var.</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((item, idx) => {
                  const { aiAmount, costVariance } = computeAmounts(item)
                  const rowBg = zebra(idx)
                  const cellKey = (col: string) => `summary-${item.id}-${col}`
                  const cellClass = (col: string) =>
                    selectedCell === cellKey(col) ? "ring-2 ring-inset ring-accent bg-accent/10" : ""
                  const select = (col: string) => () => setSelectedCell(cellKey(col))
                  return (
                    <tr key={item.id} className={rowBg}>
                      <td className={TD_NUM + " " + rowBg}>{idx + 1}</td>
                      <td className={TD_FROZEN + " " + rowBg + " text-muted"} onClick={select("trade")}>
                        <span className={cellClass("trade")}>{item.sheet}</span>
                      </td>
                      <td className={TD} onClick={select("itemno")}>
                        <span className={cellClass("itemno")}>{formatItemNo(item)}</span>
                      </td>
                      <td className={TD + " font-mono text-accent"} onClick={select("pomi")}>
                        <span className={cellClass("pomi")}>{item.pomiCode}</span>
                      </td>
                      <td className={TD + " max-w-[180px] text-muted"} title={levelBreadcrumb(item)} onClick={select("level")}>
                        <span className={"line-clamp-2 " + cellClass("level")}>{levelBreadcrumb(item)}</span>
                      </td>
                      <td className={TD + " max-w-[140px] font-mono text-[11px] text-muted"} title={item.billFile} onClick={select("bill")}>
                        <span className={"line-clamp-2 " + cellClass("bill")}>{item.billFile}</span>
                      </td>
                      <td className={TD + " max-w-[220px] text-ink"} title={item.description} onClick={select("desc")}>
                        <span className={"line-clamp-2 " + cellClass("desc")}>{item.description}</span>
                      </td>
                      <td className={TD + " text-right font-mono"} onClick={select("boqqty")}>
                        <span className={cellClass("boqqty")}>{formatQty(item.quantity, item.unit)}</span>
                      </td>
                      <td className={TD + " whitespace-nowrap text-right font-mono"} onClick={select("aiqty")}>
                        <span className={cellClass("aiqty")}>{formatQty(item.aiQuantity, item.unit)}</span>
                      </td>
                      <td className={TD + " text-right font-mono"} onClick={select("var")}>
                        <span className={cellClass("var")}>{formatVariance(item.variance)}</span>
                      </td>
                      <td className={TD + " text-right font-mono"} onClick={select("varpct")}>
                        <span className={cellClass("varpct")}>{formatPct(item.variancePct)}</span>
                      </td>
                      <td className={TD + " text-right font-mono text-muted"} onClick={select("rate")}>
                        <span className={cellClass("rate")}>{formatAed(item.rateAed)}</span>
                      </td>
                      <td className={TD + " text-right font-mono text-muted"} onClick={select("boqamt")}>
                        <span className={cellClass("boqamt")}>{formatAed(item.amountAed)}</span>
                      </td>
                      <td className={TD + " text-right font-mono text-muted"} onClick={select("aiamt")}>
                        <span className={cellClass("aiamt")}>{formatAed(aiAmount)}</span>
                      </td>
                      <td className={TD + " text-right font-mono text-muted"} onClick={select("costvar")}>
                        <span className={cellClass("costvar")}>{formatAed(costVariance, { signed: true })}</span>
                      </td>
                      <td className={TD} onClick={select("status")}>
                        <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[item.status]} ${cellClass("status")}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className={TD + " max-w-[520px] text-muted"} onClick={select("reason")}>
                        <ReasonHoverCard text={reasonDetail(item)}>
                          <span className={"line-clamp-2 " + cellClass("reason")}>{reasonDetail(item)}</span>
                        </ReasonHoverCard>
                      </td>
                    </tr>
                  )
                })}
                {discrepancies.length === 0 && (
                  <tr>
                    <td colSpan={17} className="px-3 py-4 text-center text-muted">
                      No discrepancies — every item matched within tolerance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">AI Estimate by Trade</h2>
              <p className="mt-1 text-xs text-muted">
                Trades with open discrepancies start expanded. Click a trade to open or close its detail.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {trades.map((t) => {
              const expanded = isTradeExpanded(t)
              return (
                <div key={t.sheet} className="border border-line bg-white">
                  <button
                    type="button"
                    onClick={() => toggleTrade(t)}
                    aria-expanded={expanded}
                    className="flex w-full items-start justify-between gap-4 border-b border-line bg-panel px-4 py-3 text-left hover:bg-panel/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <div className="flex gap-2.5">
                      <span className="mt-0.5 select-none text-faint">{expanded ? "▾" : "▸"}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{t.sheet}</span>
                          {t.flagged > 0 && (
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE.flagged}`}>
                              {t.flagged} flagged
                            </span>
                          )}
                          {t.missing > 0 && (
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE.missing}`}>
                              {t.missing} missing
                            </span>
                          )}
                        </div>
                        <p className="mt-1 max-w-2xl text-[11px] text-muted">
                          {COVERAGE_NOTES[t.sheet] ?? DEFAULT_COVERAGE_NOTE}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-4 text-right font-mono text-[11px]">
                      <div>
                        <div className="text-[10px] uppercase text-faint">Items</div>
                        <div>{t.total}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-faint">Avg Conf.</div>
                        <div>{formatConfidence(t.avgConfidence)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-faint">Net Var.</div>
                        <div>{formatVariance(t.netVariance)}</div>
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <>
                      <SheetToolbar
                        zoom={tradeZoom}
                        onZoomOut={() => stepZoom(setTradeZoom, -1)}
                        onZoomIn={() => stepZoom(setTradeZoom, 1)}
                        extra={
                          <>
                            <button
                              onClick={expandAll}
                              className="rounded border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted hover:border-accent hover:text-accent"
                            >
                              Expand all
                            </button>
                            <button
                              onClick={collapseAll}
                              className="rounded border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted hover:border-accent hover:text-accent"
                            >
                              Collapse all
                            </button>
                          </>
                        }
                      />
                      <div className="max-h-[520px] overflow-auto">
                        <table className="w-full border-collapse text-[16px]">
                          <thead>
                            <tr>
                              <th className={TH_NUM}>#</th>
                              <th className={TH_FROZEN}>POMI</th>
                              <th className={TH}>Item No</th>
                              <th className={TH}>Level</th>
                              <th className={TH}>Bill File</th>
                              <th className={TH}>Description</th>
                              <th className={TH + " text-right"}>BOQ Qty</th>
                              <th className={TH + " text-right"}>AI Qty</th>
                              <th className={TH + " text-right"}>Conf.</th>
                              <th className={TH + " text-right"}>Rate AED</th>
                              <th className={TH + " text-right"}>BOQ Amount</th>
                              <th className={TH + " text-right"}>AI Amount</th>
                              <th className={TH + " text-right"}>Cost Var.</th>
                              <th className={TH}>Status</th>
                              <th className={TH}>Dwg Ref</th>
                              <th className={TH}>Spec</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.rows.map((item, idx) => {
                              const { aiAmount, costVariance } = computeAmounts(item)
                              const rowBg = zebra(idx)
                              return (
                                <Fragment key={item.id}>
                                  <tr
                                    className={`cursor-pointer ${rowBg} hover:bg-accent/5`}
                                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                  >
                                    <td className={TD_NUM + " " + rowBg}>{idx + 1}</td>
                                    <td className={TD_FROZEN + " " + rowBg + " font-mono text-accent"}>{item.pomiCode}</td>
                                    <td className={TD}>{formatItemNo(item)}</td>
                                    <td className={TD + " max-w-[160px] text-muted"} title={levelBreadcrumb(item)}>
                                      <span className="line-clamp-2">{levelBreadcrumb(item)}</span>
                                    </td>
                                    <td className={TD + " max-w-[140px] font-mono text-[11px] text-muted"} title={item.billFile}>
                                      <span className="line-clamp-2">{item.billFile}</span>
                                    </td>
                                    <td className={TD + " max-w-[240px] text-ink"} title={item.description}>
                                      <span className="line-clamp-2">{item.description}</span>
                                    </td>
                                    <td className={TD + " text-right font-mono"}>{formatQty(item.quantity, item.unit)}</td>
                                    <td className={TD + " text-right font-mono"}>{formatQty(item.aiQuantity, item.unit)}</td>
                                    <td className={TD + " text-right font-mono"}>{formatConfidence(item.aiConfidence)}</td>
                                    <td className={TD + " text-right font-mono text-muted"}>{formatAed(item.rateAed)}</td>
                                    <td className={TD + " text-right font-mono text-muted"}>{formatAed(item.amountAed)}</td>
                                    <td className={TD + " text-right font-mono text-muted"}>{formatAed(aiAmount)}</td>
                                    <td className={TD + " text-right font-mono text-muted"}>{formatAed(costVariance, { signed: true })}</td>
                                    <td className={TD}>
                                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[item.status]}`}>
                                        {STATUS_LABEL[item.status]}
                                      </span>
                                    </td>
                                    <td className={TD + " font-mono text-[11px] text-muted"}>{item.drawingRef ?? "—"}</td>
                                    <td className={TD + " font-mono text-[11px] text-muted"}>{item.specClause ?? "—"}</td>
                                  </tr>
                                  {expandedItem === item.id && (
                                    <tr className="bg-panel">
                                      <td colSpan={16} className="border-b border-line-soft px-3 py-3 text-[16px] text-muted">
                                        {item.methodology && (
                                          <div className="mb-1">
                                            <span className="font-semibold text-ink">Methodology: </span>
                                            {item.methodology}
                                          </div>
                                        )}
                                        {item.reasoning && item.reasoning.length > 0 && (
                                          <ul className="list-inside list-disc space-y-0.5">
                                            {item.reasoning.map((line, i) => (
                                              <li key={i}>{line}</li>
                                            ))}
                                          </ul>
                                        )}
                                        {!item.methodology && (!item.reasoning || item.reasoning.length === 0) && (
                                          <span>No additional AI reasoning captured for this item.</span>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
