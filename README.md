# Heart & Hustle Fundraising

Monorepo for the **Heart & Hustle Fundraising** MVP: Next.js web (admin, coach, public donation/request flows) + Expo mobile (student-athlete app), Supabase, and Stripe.

## Structure

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 14 (App Router), Tailwind, public donate/join pages, coach & SuperAdmin dashboards |
| `apps/mobile` | Expo (Router) athlete app: join, SMS contacts, reminders, donations |
| `packages/shared` | Shared TypeScript types |
| `apps/web/supabase/schema.sql` | Postgres tables, RLS, storage bucket policies |
| `docs/` | App Store checklist, Illinois compliance notes |

## Prerequisites

- Node 20+ recommended  
- [Supabase](https://supabase.com) project  
- [Stripe](https://stripe.com) account (test mode for development)  
- For mobile: [Expo](https://expo.dev) CLI / EAS when you build for stores  

## Web setup

1. Copy `apps/web/.env.example` → `apps/web/.env.local` and fill values.  
2. In Supabase SQL editor, run `apps/web/supabase/schema.sql` (fresh project). Create Storage bucket **`logos`** as public if not created by script.  
   **Fundraiser codes** are always tied to one **coach email**; the coach must enter **that same email** with their code on **Coach login → Start with my code** (or use it when registering manually). If you already created `fundraiser_codes` with nullable `assigned_to_email`, backfill then run:  
   `alter table public.fundraiser_codes alter column assigned_to_email set not null;` (only after every row has a value).  
   If you started from an **older** schema without `athlete_contacts.phone_normalized`, run `apps/web/supabase/migrations/001_contact_dedupe_coach_participant.sql` once (skip if you only ever used the current `schema.sql`).  
3. **SuperAdmin**: create a user in Supabase Auth with the same email as `SUPERADMIN_EMAIL`.  
   **SuperAdmin entry (not linked from the public site):** bookmark **`/hh-enter`** — it redirects to **`/admin/login`**. You can also open `/admin/login` directly in production.  
4. From repo root:

```bash
npm install
npm run dev:web
```

5. Stripe webhook (local):  
   `stripe listen --forward-to localhost:3000/api/stripe-webhook`  
   Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

`next build` needs non-empty env vars for Supabase/Stripe (use test keys locally). See `apps/web/.env.example`.

## Coach onboarding (fundraiser code)

1. SuperAdmin emails the coach their **HH fundraiser code** (and tells them which **email** the code is tied to).  
2. The coach opens **`/coach/login`** → tab **“Start with my code”** → enters that **email** + **code** → creates a **password** → continues to **fundraiser setup** (goals, dates, logos).  
3. Next visits: same page → tab **“Returning coach”** → **email + password**.  
4. Optional **`COACH_ACTIVATION_SECRET`** in `.env.local` signs the short-lived activation cookie; if omitted, the service role key is used for signing (server-only).

## Mobile setup

1. Copy `apps/mobile/.env.example` → `apps/mobile/.env` and set Supabase + **`EXPO_PUBLIC_API_URL`** to your running web origin (e.g. `http://192.168.x.x:3000` on LAN for a physical device).  
2. **Auth**: In Supabase, disable “Confirm email” for development or participants won’t get a session immediately after `signUp` (required for the `athletes` insert + RLS).  
3. `npm run dev:mobile` from root (or `cd apps/mobile && npx expo start`).  
4. **SMS / contacts**: use a **dev build** or simulator limitations apply; Expo Go may restrict `expo-sms` / `expo-contacts` on some platforms.

## Coach as participant

The Head Organizer / campaign admin can **create a participant profile** on the coach dashboard (same `athletes` + `athlete_contacts` model as the mobile app), add contacts, and open SMS from the browser. Contacts are **deduped per participant** by normalized phone digits.

## Branding (from build doc)

- Primary: `#C0392B`  
- Dark: `#1A1A2E`  
- Accent: `#F39C12`  

## When we need you

- Real **SuperAdmin** email and production **Stripe** + **Supabase** keys on Vercel.  
- **Apple Team ID** for `apple-app-site-association` (`apps/web/app/.well-known/.../route.ts`).  
- Legal review of Illinois paperwork flow and privacy copy.  
- App Store assets per `docs/app-store-checklist.md`.  

## Stripe receipts

Enable automatic receipt emails in **Stripe Dashboard → Settings → Emails** if you promise email receipts to donors.
