import { useNavigate } from "react-router-dom"
import drawings from "../data/seed/drawings.json"
import specs from "../data/seed/specs.json"
import boq from "../data/seed/boq.json"
import { PageNav } from "../components/chrome/PageNav"
import { classifyDrawings } from "../lib/classifyDrawing"
import type { Drawing } from "../lib/types"

const DISCIPLINES = ["Architecture", "Structure", "Interior Design"] as const

const BOQ_FILES = Array.from(new Set(boq.map((b) => b.billFile)))

function countBy<T>(items: T[], key: (t: T) => string) {
  const counts: Record<string, number> = {}
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1
  return counts
}

export default function ProjectHome() {
  const navigate = useNavigate()
  const drawingCounts = countBy(drawings, (d) => d.discipline)
  const boqItemCounts = countBy(boq, (b) => b.billFile)
  const planSheetCount = classifyDrawings(drawings as Drawing[]).filter((d) => d.classification === "plan").length

  return (
    <div>
      <PageNav />
      <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Tender Package</div>
      <h1 className="text-2xl font-semibold text-ink">Villa Type C</h1>
      <p className="mt-1 text-sm text-muted">
        Zone E &amp; F · Real tender package · {drawings.length} drawing sheets · {specs.length} specification
        documents · {boq.length.toLocaleString()} BOQ line items
      </p>
      <p className="mt-1 text-xs text-faint">
        {planSheetCount} of {drawings.length} sheets auto-classified as plan-type — prioritized for this take-off run.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="rounded border border-line bg-white">
          <header className="border-b border-line-soft px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
            Drawings
          </header>
          <ul className="divide-y divide-line-soft">
            {DISCIPLINES.map((d) => (
              <li key={d} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{d}</span>
                <span className="font-mono text-xs text-muted">{drawingCounts[d] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-line bg-white">
          <header className="border-b border-line-soft px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
            BOQ Bills
          </header>
          <ul className="divide-y divide-line-soft">
            {BOQ_FILES.map((f) => (
              <li key={f} className="px-4 py-2 text-sm">
                <div className="truncate" title={f}>
                  {f}
                </div>
                <div className="font-mono text-[11px] text-faint">{boqItemCounts[f]} items</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-line bg-white">
          <header className="border-b border-line-soft px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
            Specifications
          </header>
          <ul className="divide-y divide-line-soft">
            <li className="flex items-center justify-between px-4 py-2 text-sm">
              <span>Zone E</span>
              <span className="font-mono text-xs text-muted">
                {specs.filter((s) => s.discipline === "Zone E").length}
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-2 text-sm">
              <span>Zone F</span>
              <span className="font-mono text-xs text-muted">
                {specs.filter((s) => s.discipline === "Zone F").length}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-6 rounded border border-line bg-white px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-faint">Formats accepted</div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-matched bg-matched-soft px-2 py-1 text-xs font-medium text-matched">
            PDF
          </span>
          <span className="rounded border border-matched bg-matched-soft px-2 py-1 text-xs font-medium text-matched">
            Excel
          </span>
          <span className="rounded border border-line-soft bg-panel px-2 py-1 text-xs text-faint" title="Planned for the production system">
            DWG / DXF
          </span>
          <span className="rounded border border-line-soft bg-panel px-2 py-1 text-xs text-faint" title="Planned for the production system">
            BIM (IFC)
          </span>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate("/upload")}
          className="rounded border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
        >
          Upload Drawings
        </button>
        <button
          onClick={() => navigate("/pipeline")}
          className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
        >
          Run AI Take-Off
        </button>
      </div>
      </div>
    </div>
  )
}
