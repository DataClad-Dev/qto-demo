// Public demo build: only one (redacted) drawing ships with the site.
// Every other drawing/spec path in the seed data resolves to null and the UI
// shows a "redacted" placeholder instead of trying to load a file.

export const PUBLIC_SHEET_CODE = "L00-STR-VC4400"

const PUBLIC_FILES: Record<string, string> = {
  "/drawings/02%20Structure/L00-STR-VC4400%20-%20Fdn_GF%20Reinf%20Plan.pdf": "demo/L00-STR-VC4400.pdf",
}

export function resolveAsset(publicPath: string | undefined | null): string | null {
  if (!publicPath) return null
  const file = PUBLIC_FILES[publicPath]
  return file ? `${import.meta.env.BASE_URL}${file}` : null
}

export const REDACTED_MESSAGE = "Redacted for public demo — only one sample sheet is published."
