import { useEffect, useRef, useState } from "react"

export function ReasoningTrace({ lines }: { lines: readonly string[] }) {
  const [visible, setVisible] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisible([])
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setVisible(lines.slice(0, i))
      if (i >= lines.length) clearInterval(interval)
    }, 280)
    return () => clearInterval(interval)
  }, [lines])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight })
  }, [visible])

  return (
    <div
      ref={containerRef}
      className="h-40 overflow-y-auto rounded border border-line bg-panel p-3 font-mono text-[11px] leading-relaxed text-muted"
    >
      {visible.map((line, i) => (
        <div key={i} className="mb-1 flex gap-2">
          <span className="text-faint">{String(i + 1).padStart(2, "0")}</span>
          <span>{line}</span>
        </div>
      ))}
      {visible.length === 0 && <span className="text-faint">Waiting…</span>}
    </div>
  )
}
