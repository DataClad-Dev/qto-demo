import drawings from "../data/seed/drawings.json"
import { resolveAsset } from "../lib/assets"
import { PageNav } from "../components/chrome/PageNav"

const raftSheet = drawings.find((d) => d.sheetCode === "L00-STR-VC4400")

const DELTA_ROWS = [
  {
    element: "Raft foundation — 1200mm thick zone (grid D-E)",
    change: "changed" as const,
    detail: "Thickened zone extended 1.4m further along grid E to accommodate a revised lift pit.",
    qtyImpact: "+3.2 m³",
  },
  {
    element: "Reinforcing steel — foundation mesh (grid D-E)",
    change: "changed" as const,
    detail: "Bar spacing tightened from 200mm to 150mm centres over the revised lift pit zone.",
    qtyImpact: "+0.8 t",
  },
  {
    element: "Construction joint — raft/lift pit wall junction",
    change: "added" as const,
    detail: "New 550mm-wide construction joint added around the enlarged lift pit.",
    qtyImpact: "+6 m",
  },
  {
    element: "Blinding — original lift pit footprint",
    change: "deleted" as const,
    detail: "Superseded blinding pour region removed from the revised layout.",
    qtyImpact: "−1.1 m³",
  },
]

const badgeClass: Record<string, string> = {
  added: "bg-matched-soft text-matched border-matched",
  deleted: "bg-missing-soft text-missing border-missing",
  changed: "bg-flagged-soft text-flagged border-flagged",
}

export default function RevisionCompare() {
  return (
    <div>
      <PageNav />
      <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Revision Compare</div>
      <h1 className="text-2xl font-semibold text-ink">
        {raftSheet?.sheetCode ?? "L00-STR-VC4400"} — {raftSheet?.title ?? "Fdn/GF Reinf Plan"}
      </h1>
      <p className="mt-1 text-xs text-faint">
        Revision B shown is a simulated prior state for demo purposes — only Revision C exists in the real drawing
        set. This screen illustrates how a real addendum/revision comparison would surface added, deleted and
        changed elements once two real revisions are available.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded border border-line bg-white">
          <div className="border-b border-line-soft bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
            Revision B (simulated prior state)
          </div>
          {raftSheet && (
            <iframe title="Revision B" src={resolveAsset(raftSheet.publicPath) ?? undefined} className="h-96 w-full opacity-90 grayscale-[20%]" />
          )}
        </div>
        <div className="rounded border border-line bg-white">
          <div className="border-b border-line-soft bg-accent-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Revision C (current, real)
          </div>
          {raftSheet && <iframe title="Revision C" src={resolveAsset(raftSheet.publicPath) ?? undefined} className="h-96 w-full" />}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft bg-panel text-left text-[10px] font-semibold uppercase tracking-wide text-faint">
              <th className="px-4 py-2">Element</th>
              <th className="px-4 py-2">Change</th>
              <th className="px-4 py-2">Detail</th>
              <th className="px-4 py-2 text-right">Qty Impact</th>
            </tr>
          </thead>
          <tbody>
            {DELTA_ROWS.map((row) => (
              <tr key={row.element} className="border-b border-line-soft">
                <td className="px-4 py-2 text-ink">{row.element}</td>
                <td className="px-4 py-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass[row.change]}`}>
                    {row.change}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-muted">{row.detail}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{row.qtyImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
