import type { EnrichedBoqItem } from "../../lib/types"

interface OverlayBoxProps {
  item: EnrichedBoqItem
  selected: boolean
  onSelect: (id: string) => void
  bounds?: { xPct: number; yPct: number; wPct: number; hPct: number }
}

const STATUS_STYLE: Record<EnrichedBoqItem["status"], { border: string; bg: string; text: string }> = {
  matched: { border: "border-matched", bg: "bg-matched/10", text: "text-matched" },
  flagged: { border: "border-flagged", bg: "bg-flagged/10", text: "text-flagged" },
  missing: { border: "border-missing", bg: "bg-missing/10", text: "text-missing" },
}

export function OverlayBox({ item, selected, onSelect, bounds }: OverlayBoxProps) {
  const b = bounds ?? item.overlay
  if (!b) return null
  const style = STATUS_STYLE[item.status]

  return (
    <button
      type="button"
      data-tour={selected ? "ai-overlay" : undefined}
      onClick={() => onSelect(item.id)}
      title={`${item.pomiCode} · ${formatPct(item.aiConfidence)} confidence`}
      className={`group absolute border-2 border-dashed ${style.border} ${style.bg} transition-all duration-150 hover:brightness-95 ${
        selected ? "outline outline-2 outline-offset-1 outline-accent" : ""
      }`}
      style={{
        left: `${b.xPct}%`,
        top: `${b.yPct}%`,
        width: `${b.wPct}%`,
        height: `${b.hPct}%`,
      }}
    >
      <span
        className={`pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded-[2px] bg-white px-1 font-mono text-[9px] ${style.text} shadow-sm`}
      >
        {item.pomiCode} · {Math.round(item.aiConfidence)}%
      </span>
    </button>
  )
}

function formatPct(n: number) {
  return `${Math.round(n)}%`
}
