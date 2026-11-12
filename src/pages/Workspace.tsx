import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import drawingsData from "../data/seed/drawings.json"
import { useWorkspaceStore } from "../lib/store"
import type { Drawing } from "../lib/types"
import { Toolbar } from "../components/chrome/Toolbar"
import { LayersTree } from "../components/chrome/LayersTree"
import { StatusBar } from "../components/chrome/StatusBar"
import { CommandPalette } from "../components/chrome/CommandPalette"
import { ItemTable } from "../components/workspace/ItemTable"
import { DrawingPane } from "../components/workspace/DrawingPane"
import { DetailPanel } from "../components/workspace/DetailPanel"
import { ActionBar } from "../components/workspace/ActionBar"
import { exportReviewState } from "../lib/exportExcel"
import { PageNav } from "../components/chrome/PageNav"

const drawings = drawingsData as Drawing[]

export default function Workspace() {
  const [searchParams] = useSearchParams()
  const tradeFilter = searchParams.get("trade") ?? undefined

  const items = useWorkspaceStore((s) => s.items)
  const selectedItemId = useWorkspaceStore((s) => s.selectedItemId)
  const selectItem = useWorkspaceStore((s) => s.selectItem)
  const actionsByItem = useWorkspaceStore((s) => s.actionsByItem)
  const estimatorStatusByItem = useWorkspaceStore((s) => s.estimatorStatusByItem)

  const [scale, setScale] = useState("1:100")
  const [gridOn, setGridOn] = useState(true)
  const [aiOverlayOn, setAiOverlayOn] = useState(true)
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [itemTableCollapsed, setItemTableCollapsed] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  useEffect(() => {
    if (selectedItem?.drawingRef) {
      const match = drawings.find((d) => d.sheetCode === selectedItem.drawingRef)
      if (match) setActiveDrawingId(match.id)
    }
  }, [selectedItem])

  useEffect(() => {
    if (!activeDrawingId && drawings.length > 0) {
      const firstHero = items.find((i) => i.isHero && i.drawingRef)
      const match = firstHero ? drawings.find((d) => d.sheetCode === firstHero.drawingRef) : null
      setActiveDrawingId((match ?? drawings[0]).id)
    }
  }, [activeDrawingId, items])

  const activeDrawing = drawings.find((d) => d.id === activeDrawingId) ?? null

  const stats = useMemo(() => {
    const pool = tradeFilter ? items.filter((i) => i.sheet === tradeFilter) : items
    const matched = pool.filter((i) => i.status === "matched").length
    const flagged = pool.filter((i) => i.status !== "matched").length
    const avgConfidence = pool.reduce((s, i) => s + i.aiConfidence, 0) / (pool.length || 1)
    return { matched, flagged, total: pool.length, avgConfidence }
  }, [items, tradeFilter])

  function handleSelectItem(id: string) {
    selectItem(id)
  }

  function handleJumpToDrawing(id: string) {
    setActiveDrawingId(id)
  }

  function handleJumpToItem(id: string) {
    selectItem(id)
  }

  return (
    <div className="flex h-screen flex-col">
      <PageNav />
      <Toolbar
        scale={scale}
        onScaleChange={setScale}
        gridOn={gridOn}
        onGridToggle={() => setGridOn((g) => !g)}
        aiOverlayOn={aiOverlayOn}
        onAiOverlayToggle={() => setAiOverlayOn((a) => !a)}
        onExport={() => exportReviewState(items, actionsByItem, estimatorStatusByItem)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 shrink-0 overflow-hidden border-r border-line">
          <LayersTree drawings={drawings} activeDrawingId={activeDrawingId} onSelect={setActiveDrawingId} />
        </div>

        {itemTableCollapsed ? (
          <button
            type="button"
            onClick={() => setItemTableCollapsed(false)}
            title="Expand item table"
            className="flex w-6 shrink-0 flex-col items-center gap-2 border-r border-line bg-panel pt-2 text-muted outline-none hover:bg-line-soft hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="-rotate-90">
              <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="[writing-mode:vertical-rl] text-[9px] uppercase tracking-wide">Items</span>
          </button>
        ) : (
          <div className="w-[480px] shrink-0 overflow-hidden">
            <ItemTable
              selectedItemId={selectedItemId}
              onSelect={handleSelectItem}
              tradeFilter={tradeFilter}
              onCollapse={() => setItemTableCollapsed(true)}
            />
          </div>
        )}

        <DrawingPane
          drawing={activeDrawing}
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          aiOverlayOn={aiOverlayOn}
        />

        <div className="flex w-56 shrink-0 flex-col overflow-hidden border-l border-line bg-white">
          <div className="flex-1 overflow-hidden">
            <DetailPanel item={selectedItem} />
          </div>
          {selectedItem && <ActionBar item={selectedItem} />}
        </div>
      </div>

      <StatusBar
        matchedCount={stats.matched}
        totalCount={stats.total}
        flaggedCount={stats.flagged}
        avgConfidence={stats.avgConfidence}
        revision={activeDrawing?.revision ?? undefined}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        drawings={drawings}
        boqItems={items}
        onJumpToDrawing={handleJumpToDrawing}
        onJumpToItem={handleJumpToItem}
      />
    </div>
  )
}
