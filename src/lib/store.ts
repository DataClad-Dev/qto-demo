import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnrichedBoqItem, EstimatorStatus, ReviewAction, ActionType } from "./types"
import boqData from "../data/seed/boq.enriched.json"

export interface WorkspaceFilters {
  tradeSheet?: string
  needsReviewOnly: boolean
  search: string
}

export interface WorkspaceState {
  items: EnrichedBoqItem[]
  actionsByItem: Record<string, ReviewAction[]>
  estimatorStatusByItem: Record<string, EstimatorStatus>
  selectedItemId: string | null
  filters: WorkspaceFilters
  selectItem: (id: string | null) => void
  setFilters: (f: Partial<WorkspaceFilters>) => void
  addAction: (itemId: string, action: { type: ActionType; note?: string; revisedQty?: number }) => void
  setEstimatorStatus: (itemId: string, status: EstimatorStatus) => void
  getEstimatorStatus: (itemId: string) => EstimatorStatus
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      items: boqData as EnrichedBoqItem[],
      actionsByItem: {},
      estimatorStatusByItem: {},
      selectedItemId: null,
      filters: { needsReviewOnly: false, search: "" },

      selectItem: (id) => set({ selectedItemId: id }),

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

      addAction: (itemId, action) => {
        const id = crypto.randomUUID()
        const timestamp = new Date().toISOString()
        const entry: ReviewAction = { id, itemId, timestamp, ...action }
        set((s) => ({
          actionsByItem: {
            ...s.actionsByItem,
            [itemId]: [...(s.actionsByItem[itemId] ?? []), entry],
          },
        }))
        if (action.type === "accept") get().setEstimatorStatus(itemId, "accepted")
        if (action.type === "revise") get().setEstimatorStatus(itemId, "revised")
      },

      setEstimatorStatus: (itemId, status) =>
        set((s) => ({ estimatorStatusByItem: { ...s.estimatorStatusByItem, [itemId]: status } })),

      getEstimatorStatus: (itemId) => get().estimatorStatusByItem[itemId] ?? "pending",
    }),
    {
      name: "qto-poc-state",
      partialize: (s) => ({
        actionsByItem: s.actionsByItem,
        estimatorStatusByItem: s.estimatorStatusByItem,
      }),
    }
  )
)
