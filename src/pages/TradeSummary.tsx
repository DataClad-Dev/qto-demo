import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useWorkspaceStore } from "../lib/store"
import { formatConfidence, formatVariance } from "../lib/format"
import { PageNav } from "../components/chrome/PageNav"
import { COVERAGE_NOTES, DEFAULT_COVERAGE_NOTE } from "../lib/coverageNotes"

export default function TradeSummary() {
  const navigate = useNavigate()
  const items = useWorkspaceStore((s) => s.items)
  const [expanded, setExpanded] = useState<string | null>(null)

  const trades = useMemo(() => {
    const bySheet = new Map<string, typeof items>()
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
        return { sheet, total: rows.length, matched, flagged, missing, avgConfidence, netVariance }
      })
      .sort((a, b) => b.total - a.total)
  }, [items])

  return (
    <div>
      <PageNav />
      <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Trade Summary</div>
      <h1 className="text-2xl font-semibold text-ink">Villa Type C — All Trades</h1>

      <div className="mt-6 overflow-hidden rounded border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft bg-panel text-left text-[10px] font-semibold uppercase tracking-wide text-faint">
              <th className="px-4 py-2">Trade</th>
              <th className="px-4 py-2 text-right">Items</th>
              <th className="px-4 py-2 text-right">Matched</th>
              <th className="px-4 py-2 text-right">Flagged</th>
              <th className="px-4 py-2 text-right">Missing</th>
              <th className="px-4 py-2 text-right">Avg Conf.</th>
              <th className="px-4 py-2 text-right">Net Variance</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <React.Fragment key={t.sheet}>
                <tr
                  className="cursor-pointer border-b border-line-soft hover:bg-panel"
                  onClick={() => navigate(`/workspace?trade=${encodeURIComponent(t.sheet)}`)}
                >
                  <td className="px-4 py-2 font-medium text-ink">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded(expanded === t.sheet ? null : t.sheet)
                      }}
                      className="mr-2 text-faint hover:text-ink"
                    >
                      {expanded === t.sheet ? "▾" : "▸"}
                    </button>
                    {t.sheet}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{t.total}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-matched">{t.matched}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-flagged">{t.flagged || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-missing">{t.missing || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{formatConfidence(t.avgConfidence)}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{formatVariance(t.netVariance)}</td>
                </tr>
                {expanded === t.sheet && (
                  <tr className="border-b border-line-soft bg-panel">
                    <td colSpan={7} className="px-4 py-3 text-xs text-muted">
                      {COVERAGE_NOTES[t.sheet] ?? DEFAULT_COVERAGE_NOTE}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
