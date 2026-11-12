let initPromise: Promise<typeof import("./pkg/wasm_geometry")> | null = null

async function ensureInit() {
  if (!initPromise) {
    initPromise = import("./pkg/wasm_geometry").then(async (mod) => {
      await mod.default()
      return mod
    })
  }
  return initPromise
}

export async function computePolygonArea(points: { x: number; y: number }[]): Promise<number> {
  const mod = await ensureInit()
  const flat = new Float64Array(points.length * 2)
  points.forEach((p, i) => {
    flat[i * 2] = p.x
    flat[i * 2 + 1] = p.y
  })
  return mod.polygon_area(flat)
}
