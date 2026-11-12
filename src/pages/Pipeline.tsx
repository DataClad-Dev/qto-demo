import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PipelineStage } from "../components/pipeline/PipelineStage"
import { ReasoningTrace } from "../components/pipeline/ReasoningTrace"
import { useWorkspaceStore } from "../lib/store"
import { PageNav } from "../components/chrome/PageNav"

const STAGES = [
  {
    label: "Parsing tender package",
    lines: [
      "Opened 3 BOQ workbooks: Bill No. 2 – Villa Type C.xlsx, Bill no. 1 – General Requirements_E.xlsx, Bill No.8 – Boundary Walls_E.xlsx.",
      "Indexed 174 drawing sheets across Architecture, Structure and Interior Design disciplines.",
      "Indexed 412 specification clause documents under Zone E / Zone F.",
      "Resolved sheet-code naming convention: <Level>-<Discipline>-<SheetNo> — e.g. L00-STR-VC4400.",
      "Cross-linked BOQ POMI codes against CSI-style spec section numbers where a direct reference exists.",
    ],
  },
  {
    label: "Reading drawings",
    lines: [
      "Rendering L00-STR-VC4400 — Fdn/GF Reinf Plan (Rev C) at native resolution.",
      "Rendering L00-STR-VC4201 — GF Columns & Walls Setting Out (Rev B).",
      "Rendering L00-ARC-VC4130 — Wall Types GF Plan (Rev B).",
      "Rendering L00-INT-VC4120 — Floor Finishes Plan (GF) (Rev A).",
      "Rendering ZZZ-ARC-VC4610 — Door Sched Sh1 (Rev A).",
      "Rendering ROF-STR-VC4303 — Roof Floor Framing Plan (Rev A).",
    ],
  },
  {
    label: "Detecting construction elements",
    lines: [
      "Segmenting raft foundation pour regions from reinforcement plan hatch patterns.",
      "Counting column markers and cross-referencing section schedule note blocks.",
      "Tracing blockwall hatch runs (SB100/SB150) against wall-type legend.",
      "Summing room polygons tagged by floor-finish type on interior finish plans.",
      "Counting door tags against the door schedule sheet series.",
      "Extracting steel member tags and section sizes from the roof framing plan.",
    ],
  },
  {
    label: "Generating quantities per trade",
    lines: [
      "Concrete Work — computed volumes for 74 line items across raft, slabs, columns, beams and formed finishes.",
      "Doors and Windows — computed counts for 117 line items from door/window schedule sheets.",
      "Masonry — computed areas for 57 line items from wall-type hatch patterns.",
      "Finishes — computed areas for 98 line items from interior finish plans.",
      "Applying Section 03 30 00 (Cast-In-Place Concrete) mix designations to concrete line items.",
      "Applying Section 08 14 16 (Flush Wood Doors) and Section 09 31 50 (Porcelain Tile) to matched items.",
    ],
  },
  {
    label: "Reconciling against BOQ",
    lines: [
      "Matching AI-detected quantities against 1,241 real BOQ line items across 14 trades.",
      "Raft foundation 400mm thick: BOQ 173 m³ vs detected 176 m³ — within tolerance, matched.",
      "Raft foundation 1200mm thick: BOQ 16 m³ vs detected 9 m³ — variance exceeds tolerance.",
      "Reinforcing steel to foundation: BOQ 47.75t vs detected 41.2t — flagged, mesh density partially obscured.",
      "Landscape slab-on-grade (courtyard): no matching region found in reviewed structural sheets.",
    ],
  },
  {
    label: "Flagging discrepancies",
    lines: [
      "6 items flagged for variance beyond tolerance or low detection confidence.",
      "1 item flagged as missing — no corresponding drawing region found in the reviewed sheet set.",
      "Building traceability links: each flagged item now points to its source drawing region and spec clause.",
      "Preparing Reconciliation Workspace with filterable trade summary and drawing overlay view.",
    ],
  },
] as const

const STAGE_DURATION_MS = 2200

export default function Pipeline() {
  const navigate = useNavigate()
  const totalItems = useWorkspaceStore((s) => s.items.length)
  const [stageIndex, setStageIndex] = useState(0)
  const [liveCount, setLiveCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (stageIndex >= STAGES.length) {
      setDone(true)
      return
    }
    setLiveCount(0)
    const countInterval = setInterval(() => {
      setLiveCount((c) => Math.min(totalItems, c + Math.ceil(totalItems / 20)))
    }, STAGE_DURATION_MS / 20)
    const advance = setTimeout(() => {
      clearInterval(countInterval)
      setStageIndex((i) => i + 1)
    }, STAGE_DURATION_MS)
    return () => {
      clearInterval(countInterval)
      clearTimeout(advance)
    }
  }, [stageIndex, totalItems])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => navigate("/workspace"), 1400)
    return () => clearTimeout(t)
  }, [done, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <PageNav />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">AI Take-Off in progress</div>
        <h1 className="mt-1 text-lg font-semibold text-ink">Villa Type C</h1>
      </div>

      <div className="rounded border border-line bg-white p-5">
        {STAGES.map((stage, i) => (
          <PipelineStage
            key={stage.label}
            label={stage.label}
            status={i < stageIndex ? "done" : i === stageIndex ? "active" : "pending"}
            count={i === stageIndex ? liveCount : undefined}
            total={i === stageIndex ? totalItems : undefined}
          />
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Reasoning trace</div>
        <ReasoningTrace lines={STAGES[Math.min(stageIndex, STAGES.length - 1)].lines} />
      </div>

      {done && (
        <div className="mt-6 flex items-center justify-between rounded border border-matched bg-matched-soft px-4 py-3">
          <span className="text-sm font-medium text-ink">Take-off complete. Opening reconciliation workspace…</span>
          <button
            onClick={() => navigate("/workspace")}
            className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-panel"
          >
            Continue
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
