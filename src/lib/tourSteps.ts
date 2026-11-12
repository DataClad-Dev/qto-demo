export interface TourStep {
  id: string
  route: string
  /** data-tour attribute value to spotlight, or null for a centered no-anchor step. */
  selector: string | null
  placement: "top" | "bottom" | "left" | "right" | "center"
  title: string
  body: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "problem",
    route: "/",
    selector: null,
    placement: "center",
    title: "Manual take-off doesn't scale",
    body: "Estimators manually measure quantities off 174+ drawing sheets per tender — slow, and the reasoning behind a number is rarely captured anywhere. This walkthrough shows what an AI-powered take-off actually does, live, in this app.",
  },
  {
    id: "triage",
    route: "/drawings",
    selector: "plan-toggle",
    placement: "bottom",
    title: "AI job #1: triage, not just extraction",
    body: "Before deep reading, every sheet gets classified — floor plan vs. elevation, section, schedule. This one's genuinely computed from real sheet titles, not scripted. In production this is a self-improving classifier trained on this client's own review history, not a static rule engine.",
  },
  {
    id: "extraction",
    route: "/workspace",
    selector: "ai-overlay",
    placement: "right",
    title: "Geometry-grounded extraction, not pixel-guessing",
    body: "Most AI take-off pitches point a vision model at an image and hope. This one is hybrid: real vector geometry parsed from the drawing where it exists, LLM reasoning layered on top only for what vector data can't resolve — symbols, schedules, annotations. Measured, not guessed.",
  },
  {
    id: "reasoning",
    route: "/workspace",
    selector: "reasoning-trace",
    placement: "left",
    title: "Every number ships with its citation chain",
    body: "Drawing sheet + revision, the exact detail read, the matched spec clause — the full reasoning trace, not a black-box output. Estimators don't trust numbers they can't audit; this is designed to be audited.",
  },
  {
    id: "needs-review",
    route: "/workspace",
    selector: "needs-review",
    placement: "bottom",
    title: "Confidence-triaged, not fully automated",
    body: "Low-confidence and flagged items surface first. High-confidence matches get reviewed in aggregate. The AI's job is compressing a full manual take-off into a prioritized queue — augmenting the estimator, not replacing them.",
  },
  {
    id: "correction-loop",
    route: "/workspace",
    selector: "estimator-actions",
    placement: "top",
    title: "The correction loop is the training pipeline",
    body: "Every Accept or Revise is a labeled example — the AI's guess paired with the estimator's ground truth. This funds the roadmap: production shifts high-volume classification to a self-hosted model trained on exactly this client's accumulated corrections, not a generic dataset.",
  },
  {
    id: "wasm",
    route: "/workspace",
    selector: "wasm-badge",
    placement: "top",
    title: "Real Rust → WASM, not a fake progress bar",
    body: "Drag a boundary corner and this number recalculates live — that's an actual Rust geometry engine compiled to WebAssembly, running natively in your browser. Zero server round-trip, exact math (not JS floating-point approximation), and the same module ships straight into production.",
  },
  {
    id: "governance",
    route: "/workspace",
    selector: null,
    placement: "center",
    title: "Designed to mature, and to stay private",
    body: "Phase 1 ships fast on a Reasoning LLM behind a private, zero-retention endpoint. Phase 2 shifts classification to a self-hosted model funded by the correction loop you just saw. Phase 3 extends self-hosting further. Client data stays inside a contractually-bound boundary throughout — this is a recommendation pending Gulf Contracting IT/legal sign-off, not a closed decision.",
  },
]
