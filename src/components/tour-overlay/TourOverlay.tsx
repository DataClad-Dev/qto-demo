import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTour } from "./TourContext"
import { TOUR_STEPS, type TourStep } from "../../lib/tourSteps"
import { useWorkspaceStore } from "../../lib/store"

/** Hero item used to populate the Reconciliation Workspace during the workspace legs of the tour. */
const DEMO_HERO_ITEM_ID = "C_03_03-CONCRETE_WORK-0032"

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function measure(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

export function TourOverlay() {
  const { active, stepIndex, next, prev, stop } = useTour()
  const location = useLocation()
  const navigate = useNavigate()
  const selectItem = useWorkspaceStore((s) => s.selectItem)
  const [rect, setRect] = useState<Rect | null>(null)

  const step: TourStep | null = active ? TOUR_STEPS[stepIndex] : null

  useEffect(() => {
    if (!step) return
    if (location.pathname !== step.route) {
      navigate(step.route)
    }
    if (step.route === "/workspace") {
      selectItem(DEMO_HERO_ITEM_ID)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    setRect(null)
    if (!step || !step.selector) return
    let cancelled = false
    let timeoutId: number

    function tryMeasure(attempt: number) {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${step!.selector}"]`)
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest" })
        // Let the scroll settle before measuring — scrollIntoView is not synchronous.
        window.setTimeout(() => {
          if (cancelled) return
          const found = measure(step!.selector!)
          if (found) setRect(found)
        }, 250)
        return
      }
      if (attempt < 40) {
        timeoutId = window.setTimeout(() => tryMeasure(attempt + 1), 100)
      }
    }
    tryMeasure(0)

    function onReflow() {
      const found = measure(step!.selector!)
      if (found) setRect(found)
    }
    window.addEventListener("resize", onReflow)
    window.addEventListener("scroll", onReflow, true)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      window.removeEventListener("resize", onReflow)
      window.removeEventListener("scroll", onReflow, true)
    }
  }, [step])

  if (!step) return null

  const isFirst = stepIndex === 0
  const isLast = stepIndex === TOUR_STEPS.length - 1
  const hasAnchor = step.selector !== null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-ink/60" />

      {hasAnchor && rect && (
        <div
          className="pointer-events-none fixed rounded-md ring-2 ring-accent transition-all duration-150"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 22px 4px rgba(67, 56, 202, 0.55)",
          }}
        />
      )}

      <TourBubble
        step={step}
        rect={hasAnchor ? rect : null}
        stepIndex={stepIndex}
        isFirst={isFirst}
        isLast={isLast}
        onNext={next}
        onPrev={prev}
        onStop={stop}
      />
    </div>
  )
}

function TourBubble({
  step,
  rect,
  stepIndex,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onStop,
}: {
  step: TourStep
  rect: Rect | null
  stepIndex: number
  isFirst: boolean
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onStop: () => void
}) {
  const style = bubbleStyle(step.placement, rect)

  return (
    <div className="fixed z-[101] w-80 rounded border border-accent bg-white p-4 shadow-lg" style={style}>
      <div className="mb-1.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-faint">
        <span>
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </span>
        <button onClick={onStop} className="text-faint hover:text-ink">
          Skip tour
        </button>
      </div>
      <div className="text-sm font-semibold text-ink">{step.title}</div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-panel disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={isLast ? onStop : onNext}
          className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent/90"
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  )
}

const BUBBLE_WIDTH = 320
const GAP = 14
const MARGIN = 16

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), Math.max(min, max))
}

function bubbleStyle(placement: TourStep["placement"], rect: Rect | null): CSSProperties {
  if (placement === "center" || !rect) {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
  }
  const vw = window.innerWidth
  const vh = window.innerHeight

  switch (placement) {
    case "bottom":
      return {
        left: clamp(rect.left, MARGIN, vw - BUBBLE_WIDTH - MARGIN),
        top: clamp(rect.top + rect.height + GAP, MARGIN, vh - MARGIN),
      }
    case "top":
      return {
        left: clamp(rect.left, MARGIN, vw - BUBBLE_WIDTH - MARGIN),
        top: clamp(rect.top - GAP, MARGIN, vh - MARGIN),
        transform: "translateY(-100%)",
      }
    case "right":
      return {
        left: clamp(rect.left + rect.width + GAP, MARGIN, vw - BUBBLE_WIDTH - MARGIN),
        top: clamp(rect.top, MARGIN, vh - MARGIN),
      }
    case "left":
      return {
        left: clamp(rect.left - GAP, MARGIN + BUBBLE_WIDTH, vw - MARGIN),
        top: clamp(rect.top, MARGIN, vh - MARGIN),
        transform: "translateX(-100%)",
      }
  }
}
