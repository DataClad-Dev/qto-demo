export const COVERAGE_NOTES: Record<string, string> = {
  "CONCRETE WORK":
    "AI-supported today: raft/slab volumes, column counts, formed-finish areas from 2D reinforcement and framing plans. Roadmap: rebar tonnage from congested reinforcement zones needs higher-resolution scans or native CAD/BIM input.",
  "DOORS AND WINDOWS":
    "AI-supported today: door/window counts from schedule sheets when scan quality is clean. Roadmap: automatic hardware-set matching and frame-type disambiguation from typical details.",
  MASONRY:
    "AI-supported today: wall-run length and area from hatch patterns on wall-type plans. Roadmap: fire-rating and acoustic-rating cross-checks against the specification automatically.",
  FINISHES:
    "AI-supported today: room-by-room floor/wall finish area takeoff from interior finish plans. Roadmap: skirting and threshold detail linear takeoff.",
}

export const DEFAULT_COVERAGE_NOTE =
  "AI-supported today: quantity extraction from the reviewed 2D drawing set with BOQ cross-reference. Roadmap: this trade is included in bulk reconciliation but has not yet received hand-reviewed hero-item detail in this POC."
