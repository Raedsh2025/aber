# aber-api

Aber (عابر) API: Node.js + Express + TypeScript.

    cp .env.example .env
    npm install
    npm run dev      # http://localhost:4000/health
    npm run build && npm start
    npm run lint
    npm test

## Database (Phase 2)

1. Review `db/migrations/001_init.sql`, then run it once in the Supabase SQL Editor.
   It is not re-runnable on an existing database. Never drop tables without explicit approval.
2. Run `db/migrations/002_seed_demo.sql` the same way (demo company, branches, route prices).
3. Put `DATABASE_URL` and `DATABASE_SSL=true` in your local `aber-api/.env` (Session pooler URL).
4. Create the system admin: `ADMIN_PASSWORD='<password>' npm run seed:admin -- <email>`.
