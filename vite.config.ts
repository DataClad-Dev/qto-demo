import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

// NOTE: vite-plugin-top-level-await is installed (per plan Task 6) but intentionally
// not wired in here. This project's Vite (v8, rolldown-based) is incompatible with
// that plugin's internal swc-based bundle transform (fatal `missing field 'type'`
// error during generateBundle, confirmed via isolated repro against this repo's
// pinned vite version). It's also not needed: wasm-pack's `--target web` output and
// this app's geometry-loader.ts never use literal top-level `await` syntax -- the
// wasm init call is always wrapped in an explicit async function.

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the site from /qto-demo/
  base: command === 'build' || isPreview ? '/qto-demo/' : '/',
  plugins: [react(), tailwindcss(), wasm()],
}))
