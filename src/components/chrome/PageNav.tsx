import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useWorkspaceStore } from "../../lib/store"

const LINKS = [
  { to: "/", label: "Project Home" },
  { to: "/upload", label: "Upload" },
  { to: "/trades", label: "Trade Summary" },
  { to: "/workspace", label: "Reconciliation Workspace" },
  { to: "/revisions", label: "Revision Compare" },
  { to: "/drawings", label: "Drawing Library" },
]

const CALCULATE_DELAY_MS = 2000

type ProjectKind = "villa" | "tower" | "corporate"

type Assignee = { initials: string; color: string }

type MockProject = {
  id: string
  name: string
  code: string
  meta: string
  kind: ProjectKind
  rev?: string
  assignees?: Assignee[]
  locked?: boolean
  requestFrom?: string
}

type MockFolder = {
  id: string
  name: string
  client: string
  discipline: string
  projects: MockProject[]
}

const PROJECT_FOLDERS: MockFolder[] = [
  {
    id: "arch-a",
    name: "Waterfront Villas",
    client: "Gulf Contracting Co.",
    discipline: "Architectural & structural",
    projects: [
      {
        id: "vc4",
        name: "Villa Type C",
        code: "Arch-A SV B",
        meta: "174 sheets · 412 specs",
        kind: "villa",
        rev: "Rev C IFC",
        assignees: [
          { initials: "RK", color: "bg-violet-500" },
          { initials: "AM", color: "bg-teal-500" },
        ],
      },
      {
        id: "vc3",
        name: "Villa Type B",
        code: "Arch-A SV B",
        meta: "161 sheets · 388 specs",
        kind: "villa",
        rev: "Rev B",
        assignees: [{ initials: "SF", color: "bg-amber-500" }],
      },
      {
        id: "vc2",
        name: "Villa Type A",
        code: "Arch-A SV A",
        meta: "149 sheets · 355 specs",
        kind: "villa",
        rev: "Rev D IFC",
        assignees: [{ initials: "RK", color: "bg-violet-500" }],
      },
      {
        id: "vc1",
        name: "Podium & Basement (VC1)",
        code: "Structural",
        meta: "",
        kind: "villa",
        locked: true,
        requestFrom: "R. Kaur",
      },
    ],
  },
  {
    id: "marina",
    name: "Marina District",
    client: "Gulf Contracting Co.",
    discipline: "Podium & tower shell",
    projects: [
      {
        id: "mt1",
        name: "Marina Tower Podium (MT1)",
        code: "Podium Retail",
        meta: "220 sheets · 501 specs",
        kind: "tower",
        rev: "Rev A",
        assignees: [{ initials: "JD", color: "bg-rose-500" }],
      },
      {
        id: "mt2",
        name: "Marina Tower Residences (MT2)",
        code: "Tower A–C",
        meta: "340 sheets · 610 specs",
        kind: "tower",
        rev: "Rev A",
        assignees: [
          { initials: "JD", color: "bg-rose-500" },
          { initials: "SF", color: "bg-amber-500" },
        ],
      },
    ],
  },
  {
    id: "corporate",
    name: "Corporate & Fitouts",
    client: "Gulf Contracting Co.",
    discipline: "Interior & fitout",
    projects: [
      {
        id: "gh7",
        name: "Gulf Contracting HQ Fitout (GH7)",
        code: "Interior Fitout",
        meta: "84 sheets · 140 specs",
        kind: "corporate",
        rev: "Rev F",
        assignees: [{ initials: "AM", color: "bg-teal-500" }],
      },
      {
        id: "wh3",
        name: "Logistics Warehouse 3 (WH3)",
        code: "Shell & Core",
        meta: "62 sheets · 98 specs",
        kind: "corporate",
        rev: "Rev A",
        assignees: [{ initials: "RK", color: "bg-violet-500" }],
      },
    ],
  },
]

const DEFAULT_PROJECT = PROJECT_FOLDERS[0].projects[0]

const KIND_LABEL: Record<ProjectKind, string> = {
  villa: "Villa",
  tower: "Tower",
  corporate: "Corporate",
}

function BrandMark() {
  return (
    <svg width="15" height="20" viewBox="0 0 30 40" fill="none" aria-hidden="true">
      <path d="M15 0L20.4545 5.33333L0 25.3333V14.6667L15 0Z" fill="var(--color-accent)" />
      <path
        d="M2.90827 28.177L15 40L30 25.3334V14.6667L20.4545 5.33337L0 25.3334L0.0041688 25.3375L20.4545 5.33337V20.6667L11.25 29.6667V20.1324L2.90827 28.177Z"
        fill="var(--color-ink)"
      />
    </svg>
  )
}

function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="22" viewBox="0 0 30 24" fill="none">
      <path
        d="M1 4.5A1.5 1.5 0 0 1 2.5 3h7.4a1.5 1.5 0 0 1 1.14.52l1.6 1.87a1.5 1.5 0 0 0 1.14.52H27.5A1.5 1.5 0 0 1 29 7.4v13.1a1.5 1.5 0 0 1-1.5 1.5h-25A1.5 1.5 0 0 1 1 20.5v-16Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2.75" y="6.25" width="8.5" height="6" rx="1.1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 6.25V4.5a2.5 2.5 0 0 1 5 0v1.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function AvatarStack({ assignees }: { assignees: Assignee[] }) {
  return (
    <div className="flex -space-x-1.5">
      {assignees.map((a) => (
        <span
          key={a.initials}
          className={`flex h-5 w-5 items-center justify-center rounded-full ${a.color} text-[9px] font-semibold text-white ring-2 ring-white`}
        >
          {a.initials}
        </span>
      ))}
    </div>
  )
}

function ProjectCard({ project, active, onSelect }: { project: MockProject; active: boolean; onSelect: () => void }) {
  if (project.locked) {
    return (
      <div className="flex flex-col rounded-lg border border-dashed border-line px-3.5 py-3.5 text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="text-faint/70">
            <FolderIcon active={false} />
          </span>
          <span className="text-faint">
            <LockIcon />
          </span>
        </div>
        <div className="mt-2.5 text-sm font-medium text-muted">{project.name}</div>
        <div className="mt-1 text-xs text-faint">{KIND_LABEL[project.kind]} · access not granted</div>
        <div className="mt-2.5 border-t border-line-soft pt-2.5 text-[11px] text-faint">
          Request access from <span className="font-medium text-muted">{project.requestFrom}</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col rounded-lg border px-3.5 py-3.5 text-left transition ${
        active ? "border-accent bg-accent-soft/60" : "border-line hover:border-accent/40 hover:bg-canvas"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={active ? "text-accent" : "text-faint"}>
          <FolderIcon active={active} />
        </span>
        {active && (
          <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Active
          </span>
        )}
      </div>
      <div className="mt-2.5 text-sm font-medium leading-snug text-ink">{project.name}</div>
      <div className="mt-1 text-xs text-muted">
        {KIND_LABEL[project.kind]} · {project.code}
        {project.rev && (
          <>
            {" "}
            · <span className="text-accent">{project.rev}</span>
          </>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2.5">
        <span className="font-mono text-[10px] text-faint">{project.meta}</span>
        {project.assignees && <AvatarStack assignees={project.assignees} />}
      </div>
    </button>
  )
}

function ProjectSwitcherModal({
  activeId,
  onClose,
  onSelect,
}: {
  activeId: string
  onClose: () => void
  onSelect: (p: MockProject) => void
}) {
  const [activeFolder, setActiveFolder] = useState(
    PROJECT_FOLDERS.find((f) => f.projects.some((p) => p.id === activeId))?.id ?? PROJECT_FOLDERS[0].id
  )
  const folder = PROJECT_FOLDERS.find((f) => f.id === activeFolder) ?? PROJECT_FOLDERS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 normal-case" onClick={onClose}>
      <div
        className="flex h-[520px] w-[760px] overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-60 shrink-0 flex-col bg-ink py-4">
          <div className="px-4 pb-3 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Project Folders
          </div>
          <div className="flex flex-col gap-0.5 px-2">
            {PROJECT_FOLDERS.map((f) => {
              const isActive = f.id === activeFolder
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  className={`relative flex flex-col rounded-md px-3 py-2 text-left transition ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" />}
                  <span className={`text-xs font-medium ${isActive ? "text-white" : "text-white/70"}`}>{f.name}</span>
                  <span className="mt-0.5 text-[10px] text-white/40">
                    {f.client} · {f.projects.length} sets
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
            <div>
              <div className="text-sm font-semibold text-ink">{folder.name}</div>
              <div className="mt-0.5 text-[11px] text-faint">
                {folder.client} · {folder.discipline}
              </div>
            </div>
            <button onClick={onClose} className="rounded p-1 text-faint hover:bg-line/40 hover:text-ink" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-5">
            {folder.projects.map((p) => (
              <ProjectCard key={p.id} project={p} active={p.id === activeId} onSelect={() => onSelect(p)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MockProject>(DEFAULT_PROJECT)

  return (
    <div className="relative mr-3">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded font-mono text-[10px] font-semibold uppercase tracking-wide text-faint hover:text-ink"
      >
        QTO · {selected.name}
        <svg width="8" height="8" viewBox="0 0 8 8">
          <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ProjectSwitcherModal
          activeId={selected.id}
          onClose={() => setOpen(false)}
          onSelect={(p) => {
            setSelected(p)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function BoqReportButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const [calculating, setCalculating] = useState(false)
  const isActive = location.pathname === "/report"

  function handleClick() {
    if (calculating) return
    setCalculating(true)
    setTimeout(() => {
      setCalculating(false)
      navigate("/report")
    }, CALCULATE_DELAY_MS)
  }

  return (
    <button
      onClick={handleClick}
      disabled={calculating}
      aria-busy={calculating}
      className={`ml-2 flex items-center gap-1.5 rounded bg-accent px-2.5 py-1 font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-wait disabled:opacity-90 ${
        isActive ? "ring-2 ring-accent/40 ring-offset-1" : ""
      }`}
    >
      {calculating ? (
        <>
          <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span className="animate-pulse">Calculating…</span>
        </>
      ) : (
        "BOQ Report"
      )}
    </button>
  )
}

type ReviewRequestNotification = {
  id: string
  kind: "review-request"
  from: Assignee
  fromName: string
  itemLabel: string
  time: string
}

type SystemNotification = {
  id: string
  kind: "system"
  title: string
  time: string
}

type AppNotification = ReviewRequestNotification | SystemNotification

const DUMMY_NOTIFICATIONS: AppNotification[] = [
  {
    id: "r1",
    kind: "review-request",
    from: { initials: "SF", color: "bg-amber-500" },
    fromName: "S. Fahad",
    itemLabel: "K_02_04 · Vanity countertop variance",
    time: "5m ago",
  },
  {
    id: "r2",
    kind: "review-request",
    from: { initials: "JD", color: "bg-rose-500" },
    fromName: "J. Dsouza",
    itemLabel: "C_03_03 · boundary re-measure",
    time: "38m ago",
  },
  { id: "n1", kind: "system", title: "Rev C IFC uploaded for L3 Villa Type C", time: "12m ago" },
  { id: "n2", kind: "system", title: "R. Kaur requested access to Podium & Basement", time: "1h ago" },
  { id: "n3", kind: "system", title: "BOQ Report recalculated for Marina Tower Podium", time: "3h ago" },
]

function NotificationsIcon() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const setFilters = useWorkspaceStore((s) => s.setFilters)
  const reviewRequestCount = DUMMY_NOTIFICATIONS.filter((n) => n.kind === "review-request").length

  function goToReview() {
    setOpen(false)
    setFilters({ needsReviewOnly: true })
    navigate("/workspace")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-1.5 text-faint hover:bg-line/40 hover:text-ink"
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5a4 4 0 0 0-4 4v2.1c0 .5-.18.98-.5 1.36L2.5 10.5h11l-1-1.54a2.1 2.1 0 0 1-.5-1.36V5.5a4 4 0 0 0-4-4Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M6.3 12.8a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {reviewRequestCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-white">
            {reviewRequestCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-80 rounded-lg border border-line bg-white normal-case shadow-lg">
            <div className="border-b border-line-soft px-3.5 py-2.5 text-xs font-semibold text-ink">Notifications</div>
            <div className="flex flex-col">
              {DUMMY_NOTIFICATIONS.map((n) =>
                n.kind === "review-request" ? (
                  <button
                    key={n.id}
                    type="button"
                    onClick={goToReview}
                    className="flex items-start gap-2 border-b border-line-soft px-3.5 py-2.5 text-left last:border-b-0 hover:bg-canvas"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${n.from.color} text-[9px] font-semibold text-white`}
                    >
                      {n.from.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-ink">
                        <span className="font-medium">{n.fromName}</span> requested review
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-accent">{n.itemLabel}</span>
                      <span className="mt-0.5 block text-[10px] text-faint">{n.time}</span>
                    </span>
                    <span className="mt-0.5 shrink-0 rounded border border-accent/30 bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                      Review
                    </span>
                  </button>
                ) : (
                  <div key={n.id} className="border-b border-line-soft px-3.5 py-2.5 last:border-b-0 hover:bg-canvas">
                    <div className="text-xs text-ink">{n.title}</div>
                    <div className="mt-0.5 text-[10px] text-faint">{n.time}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProfileIcon() {
  return (
    <button
      className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent hover:bg-accent-soft/80"
      aria-label="Profile"
    >
      MN
    </button>
  )
}

export function PageNav() {
  return (
    <div className="flex items-center gap-1 border-b border-line bg-white px-4 py-1.5 text-[11px]">
      <div className="mr-2.5 flex items-center">
        <BrandMark />
      </div>
      <div className="mr-2.5 h-4 w-px bg-line-soft" />
      <ProjectSwitcher />
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            isActive
              ? "rounded bg-accent-soft px-2 py-1 font-medium text-accent"
              : "rounded px-2 py-1 text-muted hover:text-ink"
          }
        >
          {link.label}
        </NavLink>
      ))}
      <BoqReportButton />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsIcon />
        <ProfileIcon />
      </div>
    </div>
  )
}
