import type { EnrichedBoqItem } from "../../lib/types"
import { formatConfidence, formatQty, formatVariance } from "../../lib/format"
import { InfoTooltip } from "../tooltip/InfoTooltip"

const STATUS_LABEL: Record<EnrichedBoqItem["status"], string> = {
  matched: "Matched",
  flagged: "Flagged",
  missing: "Missing",
}

const STATUS_CLASS: Record<EnrichedBoqItem["status"], string> = {
  matched: "text-matched",
  flagged: "text-flagged",
  missing: "text-missing",
}

export function DetailPanel({ item }: { item: EnrichedBoqItem | null }) {
  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2.5 p-4 text-center">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="text-line">
          <rect x="3.5" y="3.5" width="19" height="19" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7.5 9h11M7.5 13h11M7.5 17h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-faint">Select a BOQ row or drawing region to see traceability detail.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto text-[11px]">
      <div className="border-b border-line-soft px-2.5 py-2 text-[9px] uppercase tracking-wide text-faint">
        Selected Item · Traceability
      </div>

      <div className="border-b border-line-soft px-2.5 py-2.5">
        <div className={`font-mono font-semibold ${STATUS_CLASS[item.status]}`}>
          {item.pomiCode} · {STATUS_LABEL[item.status]}
        </div>
        <div className="mt-1 text-ink">{item.description}</div>

        <table className="mt-2.5 w-full border-collapse">
          <tbody>
            <Row label="BOQ Qty" value={formatQty(item.quantity, item.unit)} />
            <Row label="AI QTO" value={formatQty(item.aiQuantity, item.unit)} />
            <Row
              label="Variance"
              value={formatVariance(item.variance, item.unit)}
              valueClass={item.variance !== 0 ? STATUS_CLASS[item.status] : undefined}
              tooltip="variance"
            />
            <Row label="Confidence" value={formatConfidence(item.aiConfidence)} tooltip="confidence" />
            {item.gridLevel && <Row label="Grid/Level" value={item.gridLevel} tooltip="gridLevel" />}
            {item.drawingRef && (
              <Row label="Dwg Ref" value={`${item.drawingRef}${item.drawingRev ? ` Rev ${item.drawingRev}` : ""}`} tooltip="drawingRev" />
            )}
            {item.specClause && <Row label="Spec Clause" value={item.specClause} />}
          </tbody>
        </table>
      </div>

      {item.methodology && (
        <div className="border-b border-line-soft px-2.5 py-2.5">
          <div className="mb-1 flex items-center text-[9px] uppercase tracking-wide text-faint">
            Methodology
            <InfoTooltip term="methodology" />
          </div>
          <p className="text-muted">{item.methodology}</p>
        </div>
      )}

      {item.reasoning && item.reasoning.length > 0 && (
        <div data-tour="reasoning-trace" className="px-2.5 py-2.5">
          <div className="mb-1 text-[9px] uppercase tracking-wide text-faint">Reasoning trace</div>
          <ul className="space-y-1.5">
            {item.reasoning.map((line, i) => (
              <li key={i} className="flex gap-1.5 text-muted">
                <span className="text-faint">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
  tooltip,
}: {
  label: string
  value: string
  valueClass?: string
  tooltip?: string
}) {
  return (
    <tr>
      <td className="py-0.5 pr-2 text-faint">
        <span className="inline-flex items-center">
          {label}
          {tooltip && <InfoTooltip term={tooltip} />}
        </span>
      </td>
      <td className={`py-0.5 text-right font-mono ${valueClass ?? "text-ink"}`}>{value}</td>
    </tr>
  )
}
