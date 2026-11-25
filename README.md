# Aber (عابر)

A web platform for shipping companies that run lines between Syrian governorates. Branch staff receive shipments, drivers scan them onto trips, the destination branch scans them on arrival and delivers with a one-time code. Anyone can track a shipment or estimate a price without logging in.

Graduation project. Reference: `docs/aber_project_blueprint.md`. Coding rules: `docs/clinerules.md`.

## Stack

- Web: React 18, TypeScript, Vite, Tailwind CSS v4, Zustand, React Hook Form + Zod, Arabic RTL, Cairo font bundled locally (`@fontsource/cairo`).
- API: Node.js 20+, Express 5, TypeScript, raw SQL with `pg`, Zod, JWT, bcrypt.
- Database: PostgreSQL (Supabase). Row level security is on and no policies exist: only the API reaches the data.
- Tests: Vitest (both packages), Testing Library (web), Supertest (API).

## Architecture

```
Browser (React SPA, RTL)
   |  HTTPS, JSON, Bearer JWT
   v
Express API ──> routes ──> service ──> repository ──> pg Pool ──> PostgreSQL (Supabase)
                 (Zod validation,        (SQL only)
                  roles, rate limits)

Web layers (dependencies point inward):
presentation (pages, components) -> application (use cases) -> domain (entities, interfaces)
infrastructure (Axios repositories) implements the domain interfaces; app/container wires them.
```

## Folder structure

```
aber-api/
  src/modules/<name>/      routes, service, repository, tests (auth, shipments, trips, estimate, stats, ...)
  src/middlewares/         authenticate, authorize, error handler
  scripts/                 seed-admin, seed-demo, verify-env
  db/migrations/           001_init.sql, 002_seed_demo.sql (run by hand in Supabase)
  db/demo/                 003_demo_data.sql (optional SQL alternative to seed-demo)
aber-web/
  src/domain/              entities and repository interfaces
  src/application/         use cases
  src/infrastructure/      Axios repositories
  src/presentation/        features (pages), components, layouts, stores
  vercel.json, public/_redirects   SPA fallback for Vercel / Netlify
deploy/                    Arabic deployment guide and defence checklist
docs/                      blueprint, rules, VERIFY.md, DEMO.md
deploy/keepalive.yml        optional GitHub Actions keep-alive (copy to .github/workflows/)
```

## Roles

| Role | Can do |
| --- | --- |
| System admin | Approve companies, platform statistics |
| Company admin | Branches, staff, vehicles, trips, shipments, reports |
| Branch staff | Create shipments, print labels, deliver with OTP, daily report |
| Line driver | See own trips, scan loading and arrival |
| Customer (public, no login) | Public tracking and price estimate only |

Shipments are created only by branch staff and the company admin. The `customer` value stays in the database enum for compatibility.

## Run locally (Node 20+)

1. Database: in the Supabase SQL editor run `aber-api/db/migrations/001_init.sql`, then `002_seed_demo.sql`.
2. API:

       cd aber-api
       cp .env.example .env     # fill DATABASE_URL and JWT_SECRET
       npm ci
       npm run dev              # http://localhost:4000/health

3. Web, in a second terminal:

       cd aber-web
       npm ci
       npm run dev              # http://localhost:5173

First system admin: set `ADMIN_PASSWORD` in your shell, then `npm run seed:admin -- <email>`.

PowerShell example: `$env:ADMIN_PASSWORD="your-password"; npm run seed:admin -- admin@aber.local`

## Environment variables

API (`aber-api/.env`, see `.env.example`):

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Supabase Session pooler, password URL-encoded) |
| `DATABASE_SSL` | `true` for Supabase, `false` for a local database |
| `JWT_SECRET` | Random text, at least 32 characters. Keep it the same between runs |
| `JWT_EXPIRES_IN` | Token lifetime, default `8h` |
| `CORS_ORIGIN` | Allowed web origin(s), comma separated |
| `PORT` | Default `4000` |

Web (`aber-web/.env`): `VITE_API_URL`, the API base URL including `/api`. It is public, not a secret.

Never commit `.env` files or real passwords.

## Supabase setup

1. Create a project. Copy the **Session pooler** connection string into `DATABASE_URL` (URL-encode special characters in the password).
2. Run `001_init.sql` and `002_seed_demo.sql` in the SQL editor.
3. Create the admin with `npm run seed:admin`, and the demo data with `npm run seed:demo`.
4. Run `npm run verify:env` (see `docs/VERIFY.md`) to check RLS, privileges and route prices.

## Demo accounts

Created by `npm run seed:demo` (the password comes from your `DEMO_PASSWORD` variable and is not stored in Git):

| Account | Role |
| --- | --- |
| admin@aber.local | System admin |
| manager@aber.local | Company admin |
| staff@aber.local | Branch staff, Aleppo |
| staff2@aber.local | Branch staff, Damascus |
| driver@aber.local | Line driver |

Delivery code (OTP) for every demo shipment: `123456`. A 5-minute demo script (Arabic) is in `docs/DEMO.md`.

    cd aber-api
    $env:DEMO_PASSWORD="choose-a-demo-password"; npm run seed:demo

The seed is safe to run twice. Existing accounts keep their password unless `DEMO_RESET_PASSWORDS=true`.

## Tests and checks

In each package:

    npx tsc --noEmit        # web: npx tsc -b
    npm run lint
    npm test                # vitest run, non-interactive
    npm run build

## Deploy

Full Arabic guide: `deploy/DEPLOYMENT_AR.md`. Short version:

- **API on Render or Railway.** Root directory `aber-api`. Build: `npm ci && npm run build`. Start: `npm start`. Set `DATABASE_URL`, `DATABASE_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (your web URL). Check `GET /health` and `GET /health/db`.
- **Web on Vercel or Netlify.** Root directory `aber-web`. Build: `npm run build`, output `dist`. Set `VITE_API_URL=https://<your-api>/api`. The SPA fallback is already configured (`vercel.json`, `public/_redirects`), so opening an inner URL directly works.
- **Keep-alive.** `deploy/keepalive.yml` is a GitHub Actions workflow that calls `/health/db` every 3 days. Copy it to `.github/workflows/keepalive.yml` and set a repository variable `API_URL`. This lowers the chance that a free Supabase project is paused for inactivity. It is not a guarantee.
- After deploying, run the checks in `docs/VERIFY.md`.

## Scope and known limitations

- No server-side PDF. Reports and labels are printed from the browser (`Print / Save as PDF`, A4 print styles).
- No customer self-service shipment creation. The public customer can only track and estimate a price.
- No GPS or live vehicle location.
- No online payment. Cash on delivery is recorded when a shipment is delivered; there is no card or online checkout.
- Camera QR scanning needs HTTPS (or localhost). A manual tracking-number input is next to the camera.
- Tested with automated tests and mocked data. Real Supabase, phone camera, printing and the deployed environment must be checked by hand (`docs/VERIFY.md`).
