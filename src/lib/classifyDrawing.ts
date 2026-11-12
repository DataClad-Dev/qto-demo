import type { Drawing } from "./types"

/**
 * Real (not seeded) triage signal: a sheet's title-block text is checked
 * for plan-type keywords. This is a stand-in, at POC fidelity, for the
 * production system's Phase 1 sheet-classification step (see
 * docs/superpowers/specs/2026-09-08-qto-production-architecture-design.md
 * §2.1/§3.2) — it is not a claim of running a real ML/LLM classifier.
 */
export type SheetClassification = "plan" | "other"

export interface ClassifiedDrawing extends Drawing {
  classification: SheetClassification
}

export function classifySheetType(title: string): SheetClassification {
  return title.toLowerCase().includes("plan") ? "plan" : "other"
}

export function classifyDrawings(drawings: Drawing[]): ClassifiedDrawing[] {
  return drawings.map((d) => ({ ...d, classification: classifySheetType(d.title) }))
}
