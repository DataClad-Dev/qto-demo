# QTO Demo — AI Quantity Take-Off

Public demo of an AI-assisted quantity take-off and BOQ reconciliation workflow (React + Vite + WASM geometry).

Project, client, and consultant names are anonymized. Only one drawing sheet is published, with its title block redacted; all other drawings and specifications show a placeholder.

## Run locally

```bash
npm ci
npm run dev
```

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`. The workflow fails if client identifiers or extra documents appear in the build output.
