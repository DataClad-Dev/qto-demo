import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import { useNavigate } from "react-router-dom"
import { PageNav } from "../components/chrome/PageNav"

type UploadStatus = "queued" | "uploading" | "processing" | "ready" | "unsupported"

type UploadFile = {
  id: string
  name: string
  size: number
  ext: string
  status: UploadStatus
}

const SUPPORTED_EXT = new Set(["pdf", "xlsx", "xls"])

const UPLOAD_DURATION_MS = 1400
const PROCESSING_DURATION_MS = 800
const STAGGER_MS = 220
/** Batches never take longer than this to start their last file, no matter how many files land at once. */
const MAX_STAGGER_SPREAD_MS = 2500
const LARGE_BATCH_THRESHOLD = 25

function extOf(filename: string) {
  const parts = filename.split(".")
  return parts.length > 1 ? (parts.pop() as string).toLowerCase() : ""
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function relativePathOf(file: File) {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  return rel && rel.length > 0 ? rel : file.name
}

/** Recursively walks a dropped FileSystemEntry (file or folder) into a flat File list. */
function readEntry(entry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      ;(entry as FileSystemFileEntry).file((file) => {
        Object.defineProperty(file, "webkitRelativePath", { value: entry.fullPath.replace(/^\//, ""), configurable: true })
        resolve([file])
      }, () => resolve([]))
      return
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      const collected: FileSystemEntry[] = []
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) {
            Promise.all(collected.map(readEntry)).then((results) => resolve(results.flat()))
          } else {
            collected.push(...batch)
            readBatch()
          }
        }, () => resolve([]))
      }
      readBatch()
      return
    }
    resolve([])
  })
}

const EXT_COLOR: Record<string, string> = {
  pdf: "text-accent",
  xlsx: "text-matched",
  xls: "text-matched",
}

function FileIcon({ ext, muted }: { ext: string; muted?: boolean }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className={muted ? "text-faint" : EXT_COLOR[ext] ?? "text-muted"}>
      <path
        d="M2 1.5h10L18 7.5V21a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 21v-18A1.5 1.5 0 0 1 3.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M12 1.5V7.5H18" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function UploadCloudIcon() {
  return (
    <svg width="34" height="28" viewBox="0 0 34 28" fill="none" className="text-faint">
      <path
        d="M9.5 21.5A6.5 6.5 0 0 1 8 8.68a7.5 7.5 0 0 1 14.62-2.1A6 6 0 0 1 24.5 18.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 26.5V13.5M17 13.5L12.5 18M17 13.5L21.5 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-check-pop">
      <path d="M2 6.2 4.8 9 10 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusCell({ status }: { status: UploadStatus }) {
  if (status === "queued") {
    return <span className="text-[11px] text-faint">Queued…</span>
  }
  if (status === "uploading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-accent transition-all ease-out"
            style={{ width: "100%", transitionDuration: `${UPLOAD_DURATION_MS}ms` }}
          />
        </div>
        <span className="text-[11px] text-muted">Uploading…</span>
      </div>
    )
  }
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        <span className="text-[11px] text-muted">Scanning sheet…</span>
      </div>
    )
  }
  if (status === "ready") {
    return (
      <div className="flex items-center gap-1.5 text-matched">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-matched-soft">
          <CheckIcon />
        </span>
        <span className="text-[11px] font-medium">Ready</span>
      </div>
    )
  }
  return <span className="text-[11px] font-medium text-missing">Unsupported format</span>
}

export default function Upload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<Map<string, number[]>>(new Map())

  useEffect(() => {
    const timerMap = timers.current
    return () => {
      timerMap.forEach((ids) => ids.forEach((id) => window.clearTimeout(id)))
      timerMap.clear()
    }
  }, [])

  const registerTimer = (id: string, timeoutId: number) => {
    timers.current.set(id, [...(timers.current.get(id) ?? []), timeoutId])
  }

  const scheduleSimulation = useCallback((id: string, index: number, totalCount: number) => {
    const stagger = Math.min(STAGGER_MS, MAX_STAGGER_SPREAD_MS / Math.max(totalCount, 1))
    const startDelay = 200 + index * stagger
    const t1 = window.setTimeout(() => {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "uploading" } : f)))
      const t2 = window.setTimeout(() => {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing" } : f)))
        const t3 = window.setTimeout(() => {
          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "ready" } : f)))
        }, PROCESSING_DURATION_MS)
        registerTimer(id, t3)
      }, UPLOAD_DURATION_MS)
      registerTimer(id, t2)
    }, startDelay)
    registerTimer(id, t1)
  }, [])

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list)
      if (incoming.length === 0) return
      setFiles((prev) => {
        const entries: UploadFile[] = incoming.map((file) => {
          const ext = extOf(file.name)
          return {
            id: uid(),
            name: relativePathOf(file),
            size: file.size,
            ext,
            status: SUPPORTED_EXT.has(ext) ? "queued" : "unsupported",
          }
        })
        const totalCount = prev.length + entries.length
        entries.forEach((entry, i) => {
          if (entry.status === "queued") scheduleSimulation(entry.id, prev.length + i, totalCount)
        })
        return [...prev, ...entries]
      })
    },
    [scheduleSimulation]
  )

  function removeFile(id: string) {
    for (const t of timers.current.get(id) ?? []) window.clearTimeout(t)
    timers.current.delete(id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const items = e.dataTransfer.items
    const entries = items?.length
      ? (Array.from(items)
          .map((item) => item.webkitGetAsEntry?.())
          .filter((entry): entry is FileSystemEntry => entry !== null))
      : []
    if (entries.length > 0) {
      Promise.all(entries.map(readEntry)).then((results) => addFiles(results.flat()))
      return
    }
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const readyCount = files.filter((f) => f.status === "ready").length
  const unsupportedCount = files.filter((f) => f.status === "unsupported").length
  const activeCount = files.filter((f) => f.status === "queued" || f.status === "uploading" || f.status === "processing").length
  const canStart = files.length > 0 && activeCount === 0 && readyCount > 0
  const isLargeBatch = files.length > LARGE_BATCH_THRESHOLD
  const doneCount = readyCount + unsupportedCount
  const donePct = files.length > 0 ? Math.round((doneCount / files.length) * 100) : 0

  return (
    <div>
      <PageNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Tender Package</div>
        <h1 className="text-2xl font-semibold text-ink">Upload Drawings &amp; Specifications</h1>
        <p className="mt-1 text-sm text-muted">
          Dump drawing sheets, spec PDFs, or BOQ workbooks here to add them to the take-off run.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition ${
            dragActive ? "border-accent bg-accent-soft/50" : "border-line bg-white hover:border-accent/50 hover:bg-canvas"
          }`}
        >
          <UploadCloudIcon />
          <div className="mt-3 text-sm font-medium text-ink">Drag &amp; drop files or folders, or click to browse</div>
          <div className="mt-1 text-xs text-faint">Folders are scanned recursively · nothing leaves this browser tab</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              folderInputRef.current?.click()
            }}
            className="mt-3 rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent"
          >
            Select a folder…
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.dwg,.dxf,.ifc"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ""
            }}
            {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-faint">Formats accepted</span>
          <span className="rounded border border-matched bg-matched-soft px-2 py-1 text-xs font-medium text-matched">PDF</span>
          <span className="rounded border border-matched bg-matched-soft px-2 py-1 text-xs font-medium text-matched">Excel</span>
          <span className="rounded border border-line-soft bg-panel px-2 py-1 text-xs text-faint" title="Planned for the production system">
            DWG / DXF
          </span>
          <span className="rounded border border-line-soft bg-panel px-2 py-1 text-xs text-faint" title="Planned for the production system">
            BIM (IFC)
          </span>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-faint">Files ({files.length})</h2>
              <div className="flex items-center gap-3">
                {isLargeBatch && (
                  <button onClick={() => setExpanded((v) => !v)} className="text-[11px] text-accent hover:underline">
                    {expanded ? "Collapse list" : "Show all files"}
                  </button>
                )}
                <button onClick={() => files.forEach((f) => removeFile(f.id))} className="text-[11px] text-faint hover:text-ink">
                  Clear all
                </button>
              </div>
            </div>

            {isLargeBatch && !expanded ? (
              <div className="rounded border border-line bg-white px-4 py-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink">
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                        Processing {doneCount} of {files.length} files…
                      </span>
                    ) : (
                      `${doneCount} of ${files.length} files processed`
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-faint">{donePct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
                    style={{ width: `${donePct}%` }}
                  />
                </div>
                <div className="mt-2.5 flex gap-4 text-[11px] text-faint">
                  <span className="text-matched">{readyCount} ready</span>
                  {unsupportedCount > 0 && <span className="text-missing">{unsupportedCount} unsupported</span>}
                  {activeCount > 0 && <span>{activeCount} in progress</span>}
                </div>
              </div>
            ) : (
            <div className="divide-y divide-line-soft rounded border border-line bg-white">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileIcon ext={f.ext} muted={f.status === "unsupported"} />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-xs ${f.status === "unsupported" ? "text-muted" : "text-ink"}`} title={f.name}>
                      {f.name}
                    </div>
                    <div className="font-mono text-[10px] text-faint">{formatSize(f.size)}</div>
                  </div>
                  <div className="shrink-0">
                    <StatusCell status={f.status} />
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="ml-1 shrink-0 rounded p-1 text-faint hover:bg-line/40 hover:text-ink"
                    aria-label={`Remove ${f.name}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-faint">
          Mock upload — this is a non-functional proof of concept. Files stay in your browser and nothing is sent to a server.
        </p>

        <button
          onClick={() => navigate("/pipeline")}
          disabled={!canStart}
          className="mt-4 rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {activeCount > 0 ? "Processing files…" : "Run AI Take-Off"}
        </button>
      </div>
    </div>
  )
}
