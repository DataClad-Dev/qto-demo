import { useMemo, useState } from "react"
import { PUBLIC_SHEET_CODE, resolveAsset, REDACTED_MESSAGE } from "../lib/assets"
import drawingsData from "../data/seed/drawings.json"
import specsData from "../data/seed/specs.json"
import { useWorkspaceStore } from "../lib/store"
import type { Drawing, SpecDoc } from "../lib/types"
import { PageNav } from "../components/chrome/PageNav"
import { classifyDrawings } from "../lib/classifyDrawing"

const drawings = classifyDrawings(drawingsData as Drawing[])
const specs = specsData as SpecDoc[]

/** The two real sheets this POC's demo walkthrough is built around. */
const DEMO_SHEET_CODES = new Set([PUBLIC_SHEET_CODE])

function groupByDiscipline<T extends { discipline: string }>(items: T[]) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const arr = map.get(item.discipline) ?? []
    arr.push(item)
    map.set(item.discipline, arr)
  }
  return map
}

export default function DrawingLibrary() {
  const [tab, setTab] = useState<"drawings" | "specs">("drawings")
  const [query, setQuery] = useState("")
  const [openPdf, setOpenPdf] = useState<{ title: string; path: string } | null>(null)
  const [planOnly, setPlanOnly] = useState(false)
  const items = useWorkspaceStore((s) => s.items)
  const heroDrawingRefs = useMemo(
    () => new Set(items.filter((i) => i.isHero && i.drawingRef).map((i) => i.drawingRef)),
    [items]
  )

  const filteredDrawings = useMemo(
    () =>
      drawings.filter(
        (d) =>
          (d.sheetCode.toLowerCase().includes(query.toLowerCase()) ||
            d.title.toLowerCase().includes(query.toLowerCase())) &&
          (!planOnly || d.classification === "plan")
      ),
    [query, planOnly]
  )
  const filteredSpecs = useMemo(
    () =>
      specs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          (s.section ?? "").toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  )

  const drawingGroups = groupByDiscipline(filteredDrawings)
  const specGroups = groupByDiscipline(filteredSpecs)

  return (
    <div>
      <PageNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Library</div>
      <h1 className="text-2xl font-semibold text-ink">Drawings &amp; Specifications</h1>

      <div className="mt-4 flex items-center gap-4 border-b border-line">
        <button
          onClick={() => setTab("drawings")}
          className={`border-b-2 px-1 py-2 text-sm font-medium ${
            tab === "drawings" ? "border-accent text-accent" : "border-transparent text-muted"
          }`}
        >
          Drawings ({drawings.length})
        </button>
        <button
          onClick={() => setTab("specs")}
          className={`border-b-2 px-1 py-2 text-sm font-medium ${
            tab === "specs" ? "border-accent text-accent" : "border-transparent text-muted"
          }`}
        >
          Specifications ({specs.length})
        </button>
        {tab === "drawings" && (
          <button
            data-tour="plan-toggle"
            onClick={() => setPlanOnly((p) => !p)}
            className={
              planOnly
                ? "whitespace-nowrap rounded bg-accent-soft px-2 py-1 text-xs font-semibold text-accent"
                : "whitespace-nowrap rounded border border-line px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent"
            }
          >
            Plan sheets only
          </button>
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or title…"
          className="ml-auto w-64 rounded border border-line px-2 py-1 text-xs focus:border-accent focus:outline-none"
        />
      </div>

      {tab === "drawings" && (
        <div className="mt-4 space-y-6">
          {Array.from(drawingGroups.entries()).map(([discipline, items]) => (
            <section key={discipline}>
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
                {discipline} ({items.length})
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => {
                  const isDemoSheet = DEMO_SHEET_CODES.has(d.sheetCode)
                  return (
                    <button
                      key={d.id}
                      onClick={() => setOpenPdf({ title: `${d.sheetCode} — ${d.title}`, path: d.publicPath })}
                      className={
                        isDemoSheet
                          ? "flex items-start justify-between rounded border border-accent bg-accent-soft px-3 py-2 text-left ring-1 ring-accent hover:border-accent"
                          : "flex items-start justify-between rounded border border-line bg-white px-3 py-2 text-left hover:border-accent"
                      }
                    >
                      <div>
                        <div className="font-mono text-xs text-accent">{d.sheetCode}</div>
                        <div className="text-xs text-ink">{d.title}</div>
                      </div>
                      <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                        {isDemoSheet && (
                          <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            Demo Sheet
                          </span>
                        )}
                        {heroDrawingRefs.has(d.sheetCode) && (
                          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                            AI Reviewed
                          </span>
                        )}
                        {d.classification === "plan" && (
                          <span className="rounded border border-line-soft bg-panel px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                            Plan
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === "specs" && (
        <div className="mt-4 space-y-6">
          {Array.from(specGroups.entries()).map(([discipline, items]) => (
            <section key={discipline}>
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
                {discipline} ({items.length})
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setOpenPdf({ title: s.title, path: s.publicPath })}
                    className="flex items-start rounded border border-line bg-white px-3 py-2 text-left hover:border-accent"
                  >
                    <div>
                      {s.section && <div className="font-mono text-xs text-accent">{s.section}</div>}
                      <div className="text-xs text-ink">{s.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </div>

      {openPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setOpenPdf(null)}
        >
          <div
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="text-sm font-medium text-ink">{openPdf.title}</span>
              <button onClick={() => setOpenPdf(null)} className="text-faint hover:text-ink">
                ✕
              </button>
            </div>
            {resolveAsset(openPdf.path) ? (
              <iframe title={openPdf.title} src={resolveAsset(openPdf.path)!} className="flex-1" />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-faint">{REDACTED_MESSAGE}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
