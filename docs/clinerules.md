# Aber (عابر) — Agent Rules

Project: a web platform for shipping companies operating between Syrian governorates
(branches, scheduled line trips with manifests, QR per shipment, cash on delivery, PDF reports).
Graduation project — quality, clarity and explainability matter as much as features.

## 1. Source of truth
- `docs/BLUEPRINT.md` is the single source of truth: stack, architecture, folder structure,
  design system, database schema, API table, and the work plan.
- Follow it exactly. Do NOT change the stack, rename layers, or restructure folders without asking me first.
- If the blueprint is ambiguous or seems wrong, stop and ask. Do not guess.

## 2. Stack (fixed)
- Web: React 18 + TypeScript (strict) + Vite, React Router, Zustand, Axios, React Hook Form + Zod, Tailwind CSS v4, qrcode.react, html5-qrcode.
- API: Node.js + Express + TypeScript, `pg` (raw SQL, no ORM), Zod, JWT + bcryptjs, helmet, cors, express-rate-limit, pdfkit.
- DB: PostgreSQL on Supabase. The web app NEVER talks to the database directly. Flow: React -> Axios -> Express -> PostgreSQL.

## 3. Architecture (Clean Architecture)
- Dependency direction points inward only: presentation -> application -> domain; infrastructure implements domain interfaces.
- Web layers: `domain` (entities, repository interfaces, pure business rules) / `application` (use cases) /
  `infrastructure` (Axios client, API repositories) / `presentation` (components, hooks, stores, features).
- `domain` must not import React, Axios, Zustand or anything framework-specific.
- Components never call Axios. Use: component -> custom hook -> use case -> repository.
- Wire implementations only in `src/app/container.ts`.
- API request flow: route -> validateBody (Zod) -> authenticate -> authorize -> controller -> service -> repository.
  - Controller: no business logic. Service: business rules. Repository: SQL only.
- Organize frontend by feature (`features/shipments`, `features/trips`, ...), not by file type.

## 4. Clean code
- No `any`. Use `unknown` and validate with Zod. Explicit return types on exported functions.
- Names describe intent (`advanceShipmentStatus`, `weightKg`). Booleans start with `is/has/can`.
- Small single-purpose functions (about 20 lines). No magic numbers; use named constants.
- No duplicated logic: extract a function or hook when something repeats.
- Comments explain WHY, not WHAT. Code and comments in English; UI text in Arabic.
- Errors: backend throws `AppError(status, code, message)`; one central error handler. Frontend maps errors in the Axios interceptor.
- Conventional Commits (`feat(shipments): ...`). Small commits.

## 5. Arabic / RTL UI rules
- `<html lang="ar" dir="rtl">`. Font: Cairo. Use only design tokens from the blueprint (navy / gold palette).
- Use logical Tailwind classes only: `ms-* me-* ps-* pe-* text-start text-end`. Never `ml/mr/left/right`.
- Latin numbers and codes (tracking number, phone) go inside `dir="ltr"` elements.
- All user-facing messages in Arabic. Enum values stay English in code; show Arabic labels via label maps.
- Touch targets at least 44px. Every async view has loading, empty, and error states.

## 6. Backend and database rules
- Prices are computed ONLY on the server. Never trust a price sent by the client.
- Status changes must pass `canTransition` and write a row to `shipment_status_log` in the same transaction.
- Use row locks (`FOR UPDATE`) when changing a shipment or checking trip capacity.
- OTP: store only a hash. Count wrong attempts OUTSIDE the transaction (a rollback would erase the counter). Lock after 5 attempts.
- `numeric` columns come back as strings from `pg`: cast with `::float` in SQL.
- Always use parameterized queries. Never concatenate user input into SQL.
- Enable RLS on every table with no policies; the API connects with the server role. Views use `security_invoker = true`.
- Schema changes go through SQL migration files, not manual edits.

## 7. Security
- Never commit secrets. Read config from `.env` through the Zod-validated `config/env.ts`. Keep `.env.example` updated.
- Never put `service_role` keys, database URLs, or JWT secrets in the frontend.
- Rate-limit login and public tracking. Public tracking must not expose sensitive data (phones, names, prices).
- Check role AND company scope on every protected endpoint.

## 8. Known pitfalls (already verified, avoid repeating)
- TypeScript 7 removed `moduleResolution: node10` and `baseUrl`:
  - API `tsconfig`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"types": ["node"]`.
  - Web path alias: `"paths": { "@/*": ["./src/*"] }` in `tsconfig.app.json` AND `resolve.alias` in `vite.config.ts`.
- Supabase requires SSL: `DATABASE_SSL=true`. Use the Session pooler connection string. URL-encode special characters in the password.
- Camera QR scanning only works on HTTPS or localhost.
- Free Supabase projects pause after a week of inactivity; remind me before demos.

## 9. Workflow (every task)
1. Restate the task in one or two sentences and list the files you will touch.
2. Make small changes. Do not add features I did not ask for.
3. Run `npx tsc --noEmit`, the linter, and the tests. Fix every error before continuing.
4. For API work, verify against a real database and report the results honestly, including what was NOT tested.
5. End with a short summary in Arabic: what changed, why, and how to run it. I need to explain it in my defense.
6. Never claim something works unless you ran it.

## 10. Definition of done
- Type-check, lint, build and tests pass.
- Works end to end from UI to database for the scenario: create shipment -> load -> in transit -> arrived -> delivered -> PDF report.
- No secrets in the repo, `.env.example` updated, README steps still accurate.
