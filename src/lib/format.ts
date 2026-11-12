export function formatQty(n: number | null | undefined, unit?: string | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  const rounded = Math.round(n * 100) / 100
  const str = rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return unit ? `${str} ${unit}` : str
}

export function formatVariance(n: number | null | undefined, unit?: string | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  const rounded = Math.round(n * 100) / 100
  const sign = rounded > 0 ? "+" : ""
  const str = `${sign}${rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  return unit ? `${str} ${unit}` : str
}

export function formatConfidence(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  return `${Math.round(n)}%`
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

export function formatAed(n: number | null | undefined, opts?: { signed?: boolean }): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  const rounded = Math.round(n)
  const sign = opts?.signed && rounded > 0 ? "+" : ""
  return `${sign}${rounded.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}
