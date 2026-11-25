# Aber (عابر)

Web platform for shipping companies operating between Syrian governorates.
Graduation project. Source of truth: `docs/aber_project_blueprint.md`, rules in `docs/clinerules.md`.

## Structure

- `aber-web`: React 18 + TypeScript + Vite + Tailwind CSS v4 (Arabic, RTL).
- `aber-api`: Node.js + Express + TypeScript, raw SQL with `pg`.
- `aber-api/db/migrations`: SQL schema and base seed (run by hand in the Supabase SQL editor).
- `aber-api/db/demo`: demo data for the defence (run by hand, see the header of the file).
- `deploy`: deployment guide and defence readiness checklist (Arabic).
- `docs`: blueprint and rules.

## Run locally (Node 20+)

1. Database: in the Supabase SQL editor run `001_init.sql` then `002_seed_demo.sql`. Optional: `db/demo/003_demo_data.sql` (replace the demo password placeholder first, never commit it).
2. API:

       cd aber-api
       cp .env.example .env     # fill DATABASE_URL (Session pooler) and JWT_SECRET (32+ characters)
       npm install
       npm run dev              # http://localhost:4000/health

   First system admin: set `ADMIN_PASSWORD` in your shell, then `npm run seed:admin -- <email>`.
3. Web (second terminal):

       cd aber-web
       npm install
       npm run dev              # http://localhost:5173

   `VITE_API_URL` defaults are in `aber-web/.env.example`.

Checks, in each folder: `npx tsc --noEmit` (web: `npx tsc -b`), `npm run lint`, `npm test`, `npm run build`.

## Status

Implemented: auth and roles, shipments (price on the server, status log, OTP delivery with cash on delivery), trips with manifest scans and shortage detection, public tracking, screens for branch staff, driver, company admin and system admin (company approval and platform stats), branch daily report, printable QR label.

Not implemented: server-side PDF per shipment (the label page is printed from the browser instead), a customer order screen, deployment (guide in `deploy/`).

Camera QR scanning needs HTTPS or localhost. Free Supabase projects pause when idle.
