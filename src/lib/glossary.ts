/**
 * Plain-English explanations for technical terms surfaced in the UI.
 * Aimed at a non-estimator reader (e.g. a stakeholder in a sales demo).
 * Looked up by InfoTooltip — an unknown key must render nothing, never crash.
 */
export const glossary: Record<string, string> = {
  pomiCode:
    "A POMI code classifies a BOQ line item by trade and work type (e.g. concrete, masonry). It's how the AI and the BOQ reference the same element without relying on free-text descriptions.",
  confidence:
    "How sure the AI is that its detected quantity matches the actual drawing element, shown as a percentage. Lower confidence usually means the drawing detail was ambiguous or the element wasn't clearly visible.",
  variance:
    "The difference between the BOQ quantity and the AI's measured quantity (AI minus BOQ). A large variance is flagged for an estimator to review before it's trusted.",
  gridLevel:
    "The structural grid reference and building level where the element sits (e.g. \"B-C / GF\" means between grid lines B and C, on the Ground Floor). Used to locate the element on the drawing.",
  methodology:
    "A short, plain-language note on how the AI arrived at its quantity — which drawing detail it read and what measurement rule it applied.",
  drawingRev:
    "The revision letter of the drawing sheet the AI referenced (e.g. \"Rev C\"). Drawings change over a project's life, so knowing the exact revision matters for traceability.",
  aiOverlay:
    "A colored box drawn on top of the real drawing showing exactly which element the AI detected and measured, so estimators can visually verify the AI's work against the source drawing.",
  needsReview:
    "Items flagged for human attention — either because the AI's confidence was low, the variance against the BOQ was significant, or no matching drawing element could be found at all.",
}

export function getGlossaryEntry(term: string): string | undefined {
  return glossary[term]
}
