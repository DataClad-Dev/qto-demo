import "../../lib/pdfWorker"
import { useMemo, useRef, useState } from "react"
import { Document, Page } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import type { Drawing, EnrichedBoqItem } from "../../lib/types"
import { OverlayBox } from "./OverlayBox"
import { resolveAsset, REDACTED_MESSAGE } from "../../lib/assets"
import { BoundaryDragHandle, type DragBounds } from "../wasm-drag/BoundaryDragHandle"

interface DrawingPaneProps {
  drawing: Drawing | null
  items: EnrichedBoqItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  aiOverlayOn: boolean
}

export function DrawingPane({ drawing, items, selectedItemId, onSelectItem, aiOverlayOn }: DrawingPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(1500)
  const [dragBounds, setDragBounds] = useState<DragBounds | null>(null)

  const itemsOnThisSheet = useMemo(
    () => items.filter((i) => i.drawingRef === drawing?.sheetCode && i.overlay),
    [items, drawing]
  )

  const selectedItem = items.find((i) => i.id === selectedItemId)
  const selectedIsOnSheet = selectedItem && selectedItem.drawingRef === drawing?.sheetCode

  if (!drawing) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center bg-canvas text-xs text-faint">
        Select a drawing sheet from the layers tree, or select a BOQ item, to view it here.
      </div>
    )
  }

  const fileUrl = resolveAsset(drawing.publicPath)
  if (!fileUrl) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 bg-canvas text-xs text-faint">
        <span className="font-mono text-accent">{drawing.sheetCode}</span>
        <span>{REDACTED_MESSAGE}</span>
      </div>
    )
  }

  const activeBounds =
    dragBounds ??
    (selectedIsOnSheet && selectedItem?.isHero && selectedItem.overlay ? selectedItem.overlay : null)

  return (
    <div className="relative min-w-0 flex-1 overflow-auto bg-canvas">
      <div className="p-6">
        <div ref={containerRef} className="relative mx-auto inline-block bg-white shadow">
          <Document
            file={fileUrl}
            loading={<div className="p-10 text-xs text-faint">Loading {drawing.fileName}…</div>}
            error={<div className="p-10 text-xs text-missing">Failed to load {drawing.fileName}</div>}
          >
            <Page pageNumber={1} width={pageWidth} renderAnnotationLayer={false} renderTextLayer={false} />
          </Document>

          {aiOverlayOn &&
            itemsOnThisSheet.map((item) => (
              <OverlayBox
                key={item.id}
                item={item}
                selected={item.id === selectedItemId}
                onSelect={onSelectItem}
                bounds={item.id === selectedItemId && dragBounds ? dragBounds : undefined}
              />
            ))}

          {aiOverlayOn && selectedIsOnSheet && selectedItem?.isHero && activeBounds && (
            <BoundaryDragHandle
              bounds={activeBounds}
              onBoundsChange={setDragBounds}
              containerRef={containerRef}
            />
          )}
        </div>

        <div className="mx-auto mt-3 flex max-w-[4000px] items-center justify-between text-[10px] text-faint">
          <span>
            Hover a region for details · {selectedItem?.isHero ? "drag the corner handles to re-measure" : "select a hero item to enable boundary re-measurement"}
          </span>
          <label className="flex items-center gap-1.5">
            <span>Page width</span>
            <input
              type="range"
              min={1000}
              max={4000}
              value={pageWidth}
              onChange={(e) => setPageWidth(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
