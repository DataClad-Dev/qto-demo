import { InfoTooltip } from "../tooltip/InfoTooltip"

interface ToolbarProps {
  scale: string
  onScaleChange: (s: string) => void
  gridOn: boolean
  onGridToggle: () => void
  aiOverlayOn: boolean
  onAiOverlayToggle: () => void
  onExport: () => void
}

const SCALE_OPTIONS = ["1:50", "1:100", "1:200"]

const iconBtnClass =
  "flex h-[22px] w-[22px] items-center justify-center rounded-[3px] border border-line text-muted transition-colors hover:border-accent hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"

function PanIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1v4.2M7 13V8.8M1 7h4.2M8.8 7H13M7 1 5.5 2.8M7 1l1.5 1.8M7 13l-1.5-1.8M7 13l1.5-1.8M1 7l1.8-1.5M1 7l1.8 1.5M13 7l-1.8-1.5M13 7l-1.8 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ZoomFitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 4.5v-3h3M12.5 4.5v-3h-3M1.5 9.5v3h3M12.5 9.5v3h-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4.5" y="4.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function MeasureIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1.2" y="4.8" width="11.6" height="4.4" rx="0.8" transform="rotate(-45 7 7)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.6 5.6 6.4 6.4M7.3 3.9l.8.8M4 7.2l.8.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function AnnotateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.4 2.1 11.9 4.6 4.9 11.6 2 12l.4-2.9 7-7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 3.5 10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const TOOLS = [
  { key: "pan", label: "Pan / Select", Icon: PanIcon },
  { key: "zoom", label: "Zoom to fit", Icon: ZoomFitIcon },
  { key: "measure", label: "Measure", Icon: MeasureIcon },
  { key: "annotate", label: "Annotate", Icon: AnnotateIcon },
] as const

/**
 * Thin CAD-tool toolbar row — matches cad-style.html's toolbar 1:1:
 * icon buttons, scale/grid text, right-aligned AI Overlay pill + Export button.
 */
export function Toolbar({
  scale,
  onScaleChange,
  gridOn,
  onGridToggle,
  aiOverlayOn,
  onAiOverlayToggle,
  onExport,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3.5 border-b border-line bg-white px-2.5 py-1.5 text-[11px] text-muted">
      <div className="flex gap-1.5">
        {TOOLS.map(({ key, label, Icon }) => (
          <button key={key} type="button" className={iconBtnClass} title={label} aria-label={label}>
            <Icon />
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-line-soft" />

      <label className="flex items-center gap-1.5">
        <span>Scale</span>
        <select
          value={scale}
          onChange={(e) => onScaleChange(e.target.value)}
          className="cursor-pointer rounded-[3px] border border-line bg-white px-1 py-0.5 text-[11px] text-muted outline-none hover:border-accent"
        >
          {SCALE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onGridToggle}
        className="cursor-pointer text-muted transition-colors hover:text-ink"
      >
        Grid: {gridOn ? "on" : "off"}
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onAiOverlayToggle}
          className={
            aiOverlayOn
              ? "rounded-[3px] bg-accent-soft px-2.5 py-[3px] font-semibold text-accent transition-colors"
              : "rounded-[3px] border border-line px-2.5 py-[3px] font-semibold text-muted transition-colors"
          }
        >
          AI Overlay: {aiOverlayOn ? "ON" : "OFF"}
        </button>
        <InfoTooltip term="aiOverlay" />
        <button
          type="button"
          onClick={onExport}
          className="rounded-[3px] border border-line px-2.5 py-[3px] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Export
        </button>
      </div>
    </div>
  )
}
