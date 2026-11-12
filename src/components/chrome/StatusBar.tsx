import { useEffect, useRef, useState } from "react"

interface StatusBarProps {
  matchedCount: number
  totalCount: number
  flaggedCount: number
  avgConfidence: number
  cursorPos?: { x: number; y: number }
  revision?: string
}

function useBump(value: number) {
  const prev = useRef(value)
  const [bumped, setBumped] = useState(false)

  useEffect(() => {
    if (prev.current !== value) {
      setBumped(true)
      const t = setTimeout(() => setBumped(false), 500)
      prev.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  return bumped
}

/**
 * Bottom status bar — matches cad-style.html: left summary string, right
 * monospace coordinates + revision.
 */
export function StatusBar({
  matchedCount,
  totalCount,
  flaggedCount,
  avgConfidence,
  cursorPos,
  revision,
}: StatusBarProps) {
  const matchedBumped = useBump(matchedCount)
  const flaggedBumped = useBump(flaggedCount)

  return (
    <div className="flex items-center justify-between border-t border-line bg-panel px-2.5 py-1 font-mono text-[10px] text-faint">
      <div>
        <span className={`transition-colors duration-300 ${matchedBumped ? "text-matched" : ""}`}>
          {matchedCount}/{totalCount} matched
        </span>
        {" · "}
        <span className={`transition-colors duration-300 ${flaggedBumped ? "text-flagged" : ""}`}>
          {flaggedCount} variance flags
        </span>
        {" · avg conf "}
        {Math.round(avgConfidence)}%
      </div>
      <div>
        {cursorPos && (
          <span>
            X: {cursorPos.x.toFixed(1)} &nbsp; Y: {cursorPos.y.toFixed(1)}
            {revision ? "   " : ""}
          </span>
        )}
        {revision && <span>Rev: {revision}</span>}
      </div>
    </div>
  )
}
