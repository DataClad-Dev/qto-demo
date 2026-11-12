import { motion } from "framer-motion"

interface PipelineStageProps {
  label: string
  status: "pending" | "active" | "done"
  count?: number
  total?: number
}

export function PipelineStage({ label, status, count, total }: PipelineStageProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {status === "done" && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-matched text-[10px] font-bold text-white">
            ✓
          </div>
        )}
        {status === "active" && (
          <motion.div
            className="h-3 w-3 rounded-full bg-accent"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        {status === "pending" && <div className="h-3 w-3 rounded-full border border-line" />}
      </div>
      <div className="flex-1">
        <span
          className={
            status === "pending" ? "text-faint" : status === "active" ? "font-semibold text-ink" : "text-ink"
          }
        >
          {label}
        </span>
      </div>
      {status === "active" && count !== undefined && total !== undefined && (
        <span className="font-mono text-[11px] text-muted">
          {count.toLocaleString()} / {total.toLocaleString()}
        </span>
      )}
      {status !== "pending" && (
        <div className="h-1 w-32 overflow-hidden rounded-full bg-line-soft">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: status === "done" ? "100%" : "0%" }}
            animate={{ width: status === "done" ? "100%" : "100%" }}
            transition={{ duration: status === "done" ? 0 : 1.8, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  )
}
