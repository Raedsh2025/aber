# Aber (عابر)

Web platform for shipping companies operating between Syrian governorates.
Graduation project. Source of truth: `docs/aber_project_blueprint.md`, rules in `docs/clinerules.md`.

## Structure

- `aber-web`: React 18 + TypeScript + Vite + Tailwind CSS v4 (Arabic, RTL).
- `aber-api`: Node.js + Express + TypeScript.
- `docs`: blueprint and rules.

## Run locally (Node 20+)

    cd aber-api && cp .env.example .env && npm install && npm run dev   # http://localhost:4000/health
    cd aber-web && npm install && npm run dev                          # http://localhost:5173

Checks, in each folder: `npx tsc --noEmit` (web: `npx tsc -b`), `npm run lint`, `npm test`, `npm run build`.

## Status

Phase 1 (foundation) only. The database (Supabase) is set up in Phase 2.
