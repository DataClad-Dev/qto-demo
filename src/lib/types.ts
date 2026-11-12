export type ReviewStatus = "matched" | "flagged" | "missing"
export type EstimatorStatus = "pending" | "accepted" | "revised"
export type ActionType = "accept" | "revise" | "comment" | "assumption"

export interface OverlayRegion {
  page: number
  xPct: number
  yPct: number
  wPct: number
  hPct: number
}

export interface BoqItem {
  id: string
  billFile: string
  sheet: string
  itemNo: number | string | null
  level1: string | null
  level2: string | null
  level3: string | null
  pomiCode: string
  description: string
  quantity: number
  unit: string | null
  rateAed: number | null
  amountAed: number | null
}

export interface EnrichedBoqItem extends BoqItem {
  aiQuantity: number
  aiConfidence: number
  variance: number
  variancePct: number
  status: ReviewStatus
  isHero: boolean
  drawingRef?: string
  drawingRev?: string
  gridLevel?: string
  methodology?: string
  reasoning?: string[]
  specClause?: string
  overlay?: OverlayRegion
}

export interface ReviewAction {
  id: string
  itemId: string
  type: ActionType
  note?: string
  revisedQty?: number
  timestamp: string
}

export interface Drawing {
  id: string
  discipline: "Architecture" | "Structure" | "Interior Design"
  fileName: string
  sheetCode: string
  title: string
  revision: string | null
  publicPath: string
}

export interface SpecDoc {
  id: string
  section: string | null
  title: string
  discipline: string
  fileName: string
  publicPath: string
}
