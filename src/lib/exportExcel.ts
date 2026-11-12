import * as XLSX from "xlsx"
import type { EnrichedBoqItem, EstimatorStatus, ReviewAction } from "./types"

export function exportReviewState(
  items: EnrichedBoqItem[],
  actionsByItem: Record<string, ReviewAction[]>,
  estimatorStatusByItem: Record<string, EstimatorStatus>
) {
  const rows = items.map((item) => {
    const actions = actionsByItem[item.id] ?? []
    const lastComment = [...actions].reverse().find((a) => a.note)
    return {
      Trade: item.sheet,
      Item: item.pomiCode,
      Location: [item.level1, item.level2, item.level3].filter(Boolean).join(" / "),
      "Drawing Ref": item.drawingRef ?? "",
      "Drawing Rev": item.drawingRev ?? "",
      Measurement: item.description,
      "BOQ Qty": item.quantity,
      "AI Qty": item.aiQuantity,
      Unit: item.unit ?? "",
      Variance: item.variance,
      "Variance %": item.variancePct,
      "BOQ Ref": item.pomiCode,
      "AI Confidence": item.aiConfidence,
      "Estimator Status": estimatorStatusByItem[item.id] ?? "pending",
      Remarks: lastComment?.note ?? "",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "QTO Review Export")
  XLSX.writeFile(workbook, "QTO-Review-Export.xlsx")
}
