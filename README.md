# Lakeshore MUBAS Transport

Lakeshore is a passenger booking and transport management application built with React, Vite and Supabase.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set the Supabase project URL, publishable/anon key and PayChangu public key.
4. Run `npm run dev`; run `npm run build` before submitting changes.

## Server-side secrets

Never put PayChangu secret keys or Supabase service-role keys in browser code or any `VITE_*` variable. Configure `PAYCHANGU_SECRET_KEY` as a Supabase Edge Function secret. The Supabase runtime supplies its service-role key; do not copy it into the client environment.

The `.env` file is ignored by Git. If a secret was ever committed, deleting the file does not remove it from Git history: revoke/rotate the credential at its provider and review deployment logs and access.

## Booking payment verification

The booking checkout uses two Supabase Edge Functions:

- `prepare-booking-payment`: authenticates the passenger, reads the passenger's booking amount and seat, and creates a pending transaction reference.
- `verify-booking-payment`: independently verifies the transaction with PayChangu and only then marks the passenger's booking as paid.

Deploy both functions and configure their server secrets before enabling payments in production. Never treat the PayChangu browser callback as proof of payment.

## Security and operational notes

- Passenger dashboards should only read the signed-in passenger's own record.
- Database row-level security and column-level write permissions must prevent passengers from changing payment status, payment references or payout state directly.
- Seat availability shown in the browser is advisory; the database must enforce seat uniqueness atomically before a booking can be confirmed.
- Payouts are intentionally paused in the admin UI until the server-side payout endpoint can be audited for administrator authorization, payment-state checks and idempotency.
