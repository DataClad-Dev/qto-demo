import { useEffect, useRef, useState, type RefObject } from "react"
import { computePolygonArea } from "../../wasm/geometry-loader"

export interface DragBounds {
  xPct: number
  yPct: number
  wPct: number
  hPct: number
}

interface BoundaryDragHandleProps {
  bounds: DragBounds
  onBoundsChange: (b: DragBounds) => void
  containerRef: RefObject<HTMLElement | null>
  /**
   * Demo simplification: real-world width the rendered page is assumed to
   * represent, in meters. There is no real georeferencing in this POC — this
   * lets the WASM area calculation return a plausible m² figure for the live
   * drag interaction rather than a raw percentage number.
   */
  assumedPageWidthMeters?: number
  assumedPageAspect?: number
}

type Corner = "tl" | "tr" | "bl" | "br"

const CORNERS: Corner[] = ["tl", "tr", "bl", "br"]

export function BoundaryDragHandle({
  bounds,
  onBoundsChange,
  containerRef,
  assumedPageWidthMeters = 18,
  assumedPageAspect = 0.7,
}: BoundaryDragHandleProps) {
  const [area, setArea] = useState<number | null>(null)
  const dragCorner = useRef<Corner | null>(null)

  useEffect(() => {
    const heightMeters = assumedPageWidthMeters * assumedPageAspect
    const points = [
      { x: (bounds.xPct / 100) * assumedPageWidthMeters, y: (bounds.yPct / 100) * heightMeters },
      { x: ((bounds.xPct + bounds.wPct) / 100) * assumedPageWidthMeters, y: (bounds.yPct / 100) * heightMeters },
      {
        x: ((bounds.xPct + bounds.wPct) / 100) * assumedPageWidthMeters,
        y: ((bounds.yPct + bounds.hPct) / 100) * heightMeters,
      },
      { x: (bounds.xPct / 100) * assumedPageWidthMeters, y: ((bounds.yPct + bounds.hPct) / 100) * heightMeters },
    ]
    let cancelled = false
    computePolygonArea(points).then((a) => {
      if (!cancelled) setArea(a)
    })
    return () => {
      cancelled = true
    }
  }, [bounds, assumedPageWidthMeters, assumedPageAspect])

  function handlePointerDown(corner: Corner) {
    return (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragCorner.current = corner
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const corner = dragCorner.current
    const container = containerRef.current
    if (!corner || !container) return
    const rect = container.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100

    onBoundsChange(resizeFromCorner(bounds, corner, px, py))
  }

  function handlePointerUp() {
    dragCorner.current = null
  }

  const handleStyle = (corner: Corner) => {
    const isTop = corner === "tl" || corner === "tr"
    const isLeft = corner === "tl" || corner === "bl"
    return {
      left: `${bounds.xPct + (isLeft ? 0 : bounds.wPct)}%`,
      top: `${bounds.yPct + (isTop ? 0 : bounds.hPct)}%`,
    }
  }

  return (
    <>
      {CORNERS.map((corner) => (
        <div
          key={corner}
          onPointerDown={handlePointerDown(corner)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[2px] border border-white bg-accent shadow"
          style={handleStyle(corner)}
        />
      ))}
      <div
        data-tour="wasm-badge"
        className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[2px] bg-ink px-1.5 py-0.5 font-mono text-[10px] text-white shadow"
        style={{ left: `${bounds.xPct + bounds.wPct / 2}%`, top: `${bounds.yPct + bounds.hPct + 1}%` }}
      >
        {area === null ? "computing…" : `${area.toFixed(2)} m² (live, WASM)`}
      </div>
    </>
  )
}

function resizeFromCorner(b: DragBounds, corner: Corner, px: number, py: number): DragBounds {
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  px = clamp(px)
  py = clamp(py)

  let { xPct, yPct, wPct, hPct } = b
  const right = xPct + wPct
  const bottom = yPct + hPct

  if (corner === "tl") {
    xPct = Math.min(px, right - 2)
    yPct = Math.min(py, bottom - 2)
    wPct = right - xPct
    hPct = bottom - yPct
  } else if (corner === "tr") {
    wPct = Math.max(2, px - xPct)
    yPct = Math.min(py, bottom - 2)
    hPct = bottom - yPct
  } else if (corner === "bl") {
    xPct = Math.min(px, right - 2)
    wPct = right - xPct
    hPct = Math.max(2, py - yPct)
  } else {
    wPct = Math.max(2, px - xPct)
    hPct = Math.max(2, py - yPct)
  }

  return { xPct, yPct, wPct, hPct }
}
