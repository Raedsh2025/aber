# Verification guide

Run these checks against your own database and your deployed URLs. Nothing here writes data.

## 1. Automatic checks: `npm run verify:env`

From `aber-api`, set the variables in your shell (PowerShell shown) and run:

    $env:DATABASE_URL="postgresql://..."        # your Supabase Session pooler string
    $env:DATABASE_SSL="true"
    $env:API_URL="https://your-api.example.com" # no trailing slash, no /api
    $env:VERIFY_LOGIN_EMAIL="manager@aber.local"
    $env:VERIFY_LOGIN_PASSWORD="your demo password"
    $env:VERIFY_TRACKING_NUMBER="AB26...."      # copy one from the shipments screen
    npm run verify:env

What it does:

| Check | How |
| --- | --- |
| Damascus date logic | Prints `v_branch_daily_report` rows by day and cross-checks them against `created_at AT TIME ZONE 'Asia/Damascus'` |
| RLS | Every table in `public` must have row level security enabled |
| Privileges | `anon` and `authenticated` must have no table privileges |
| Route prices | Every ordered pair of branch governorates must have a price. Missing pairs are listed |
| `GET /health`, `GET /health/db` | Must return 200 |
| `POST /api/auth/login` | Demo account must get a token |
| `GET /api/public/track/<number>` | Must return 200 |
| `GET /api/public/estimate` | Uses two priced governorates from `/api/public/governorates` |

It prints a PASS or FAIL line for each check and exits with code 1 if any failed. Fix every FAIL before the defence.

A missing variable shows up as a FAIL for that check, not as a crash.

## 2. Manual checklist (on the deployed version)

- [ ] **QR with a phone camera over HTTPS.** Open the deployed site on a phone, sign in as the driver, open a trip, scan the QR label. If the camera is blocked, the page must be HTTPS.
- [ ] **Inner URL opened directly.** Paste `https://<web>/branch/shipments`, `/estimate` and a label URL into a new tab. No 404 page.
- [ ] **Print in Arabic.** Open the daily report, the shipment page and the label. Press "Print / Save as PDF". Check A4, Arabic text is correct and joined, navigation and buttons are hidden, the QR and tracking number are visible, no card is split across pages.
- [ ] **Full scenario**: created, loaded, in transit, arrived, delivered:
  1. Branch staff creates a shipment (check the live price preview).
  2. Driver scans loading.
  3. Driver starts the trip.
  4. Driver or destination staff scans arrival.
  5. Destination staff delivers with the OTP.
  6. Public tracking page shows every step.
- [ ] **Public estimate** at `/estimate`: pick a priced route, enter a weight, see the price. An unpriced route shows the Arabic message.
- [ ] **System admin** dashboard shows the cards and the 14-day chart.

## What these checks cannot prove

The automatic script proves the database and API answer as expected at the moment you run it. It does not test the browser, the camera, printing or load.
