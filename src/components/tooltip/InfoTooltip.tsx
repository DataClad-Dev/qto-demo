import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { glossary } from "../../lib/glossary"

interface InfoTooltipProps {
  term: string
}

/**
 * Small "info" glyph that reveals a plain-English glossary popover on hover/focus.
 * Renders nothing if the term isn't in the glossary — never crashes on an unknown term.
 *
 * Portals the popover to <body> with viewport-measured fixed positioning instead of
 * an absolutely-positioned sibling: several triggers (right panel, table headers) sit
 * inside overflow-hidden/overflow-auto ancestors that clip an in-flow popover before
 * it's ever visible, no matter how high its z-index is set.
 */
export function InfoTooltip({ term }: InfoTooltipProps) {
  const copy = glossary[term]
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    if (!open) return
    function measure() {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      setPos({ top: rect.top - 6, right: window.innerWidth - rect.right })
    }
    measure()
    window.addEventListener("scroll", measure, true)
    window.addEventListener("resize", measure)
    return () => {
      window.removeEventListener("scroll", measure, true)
      window.removeEventListener("resize", measure)
    }
  }, [open])

  if (!copy) return null

  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        ref={btnRef}
        type="button"
        tabIndex={0}
        aria-label={`What is ${term}?`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line text-[9px] leading-none text-faint outline-none hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
      >
        i
      </button>
      {open &&
        pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: pos.top, right: pos.right }}
            className="pointer-events-none fixed z-[200] w-56 max-w-[70vw] -translate-y-full rounded border border-line bg-white p-2 text-[11px] font-normal leading-snug text-ink shadow-md"
          >
            {copy}
          </span>,
          document.body
        )}
    </span>
  )
}
