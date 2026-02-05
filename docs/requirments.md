Below is a **Claude Code–ready requirements document** for a “Campaign Giveaway” system to collect **up to 650 shipping addresses** (and optional email verification), built with **Next.js + TypeScript + Tailwind + Supabase (Postgres) + Mailgun**.

---

## Project: Campaign Giveaway Pages (Book Voucher / Physical Shipping)

### 1) Goal

Create a lightweight system that lets you spin up multiple **campaign landing pages** (Stanford, partner events, etc.) to collect **physical mailing addresses** for sending books/vouchers, with optional controls:

* Require or not require email
* Optional “confirm email” step
* Optional invite/access code
* Optional scarcity messaging (remaining slots)
* Basic admin dashboard for campaign setup + exports

Primary success metric: **Collect 650 valid shipping addresses** with minimal friction.

---

## 2) Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, Tailwind
* **Backend/Data:** Supabase (Postgres + Row Level Security)
* **Email:** Mailgun (only if email verification is enabled)
* **Hosting:** Vercel or similar (stateless). Supabase hosts DB.

---

## 3) Core Concepts

### Campaign

A campaign is a configurable giveaway page:

* URL: `/c/[slug]` (e.g., `/c/stanford`, `/c/partner-x`)
* Has capacity (e.g., 50, 650, etc.)
* Has field requirements (address required always; email optional/required; company optional; etc.)
* Optional controls: invite code, scarcity UI, email verification

### Signup / Claim

A user submits the form on a campaign page, creating a “claim” record:

* “Pending” if email verification is required and not verified yet
* “Confirmed” if verified (or if verification disabled)
* “Duplicate/Invalid” if blocked by dedupe/rules

---

## 4) User Roles

### Public user

* Visits campaign page
* Submits shipping address (and optional fields)
* If enabled: confirms email via link
* Sees success screen

### Admin

* Creates/edits campaigns
* Views signups
* Exports CSV
* Marks records as shipped/fulfilled (optional)
* Sees metrics

Admin auth: Supabase Auth (email magic link) + allowlist of admin emails in env.

---

## 5) UX Requirements

### 5.1 Campaign Landing Page (`/c/[slug]`)

Sections:

1. Header: campaign title + short explanation (“We’ll ship your copy. We only use address to send the book.”)
2. Trust block: privacy promise + data usage
3. Form: address + configurable optional fields
4. Optional scarcity: “X of Y claimed” or “Y remaining”
5. Submit CTA
6. Confirmation screen

Form fields (config-driven):

* Required always:

  * First name
  * Last name
  * Street address
  * City
  * State/Region
  * Postal code
  * Country (default US, selectable)
* Optional/Configurable:

  * Email (optional OR required)
  * Company / Organization
  * Role/Title (optional)
  * Phone (optional)
* Optional: checkbox “I agree to terms/data use” (required)

Validation:

* Client validation + server validation
* Normalize address fields (trim, uppercase state, etc.)

### 5.2 Email Verification (Optional)

If campaign requires verification:

* After submit, show “Check your email to confirm”
* Send verification email with one-click link: `/verify?token=...`
* When clicked:

  * Mark claim as `confirmed`
  * Show “Confirmed. You’re in.”

Important: keep friction low:

* Email verification should be a campaign toggle, default OFF for high-volume capture.

### 5.3 Invite Code (Optional)

If enabled:

* Campaign requires either:

  * a code field in the form, or
  * a link parameter like `?code=ABC123` (pre-fills/locks)
* Codes can be:

  * single shared code per campaign, or
  * list of codes with usage limits

### 5.4 Scarcity / Capacity Handling

Campaign has `capacity_total`.
System tracks `confirmed_count` (and optionally `pending_count`).
Rules:

* If verification OFF: capacity uses confirmed immediately.
* If verification ON: capacity can either count only confirmed OR reserve pending for a short TTL.

  * Simplest: count confirmed only.
  * Optional improvement: reserve pending for 30–60 minutes with expiration.

When capacity reached:

* Show “All claimed” message
* Optionally allow waitlist mode (future enhancement)

---

## 6) Data Model (Supabase Postgres)

### 6.1 Tables

#### `campaigns`

* `id` (uuid, pk)
* `slug` (text, unique, indexed)
* `title` (text)
* `description` (text)
* `capacity_total` (int)
* `is_active` (bool)
* `start_at` (timestamptz, nullable)
* `end_at` (timestamptz, nullable)

Config fields:

* `require_email` (bool)
* `require_email_verification` (bool)
* `require_invite_code` (bool)
* `show_scarcity` (bool)
* `collect_company` (bool)
* `collect_phone` (bool)
* `collect_title` (bool)

Privacy copy overrides:

* `privacy_blurb` (text, nullable)

Anti-abuse:

* `max_claims_per_email` (int, default 1)
* `max_claims_per_ip_per_day` (int, default e.g. 5)

#### `invite_codes` (optional if invite code feature enabled)

* `id` (uuid, pk)
* `campaign_id` (uuid, fk -> campaigns)
* `code` (text, indexed)
* `max_uses` (int, nullable)
* `uses` (int, default 0)
* `is_active` (bool, default true)

#### `claims`

* `id` (uuid, pk)
* `campaign_id` (uuid, fk -> campaigns, indexed)
* `status` (text enum: `pending`, `confirmed`, `rejected`, `shipped`)
* `created_at` (timestamptz)
* `confirmed_at` (timestamptz, nullable)

User fields:

* `first_name` (text)
* `last_name` (text)
* `email` (text, nullable, indexed)
* `company` (text, nullable)
* `title` (text, nullable)
* `phone` (text, nullable)

Shipping:

* `address1` (text)
* `address2` (text, nullable)
* `city` (text)
* `region` (text) // state/province
* `postal_code` (text)
* `country` (text)

Invite:

* `invite_code` (text, nullable)

Dedup helpers:

* `email_normalized` (text, nullable, indexed)
* `address_fingerprint` (text, indexed) // hash of normalized address + name

Audit:

* `ip_hash` (text, nullable)
* `user_agent` (text, nullable)

#### `email_verifications` (only if verification enabled)

* `id` (uuid, pk)
* `claim_id` (uuid, fk -> claims)
* `token_hash` (text, unique)
* `expires_at` (timestamptz)
* `used_at` (timestamptz, nullable)

### 6.2 Row Level Security (RLS)

* Public:

  * Can insert into `claims` only via server route (recommended), not direct client.
  * Can read limited campaign public fields (title, description, capacity, toggles).
* Admin:

  * Full access to campaigns, claims, exports.
    Use Supabase Auth + policies restricting admin operations by allowlisted emails.

---

## 7) API / Server Routes (Next.js)

Use Next.js Route Handlers under `/app/api`.

### `POST /api/campaigns/[slug]/claim`

Creates claim.
Steps:

1. Load campaign, ensure active + within date window
2. Validate invite code if required
3. Validate form fields per campaign config
4. Anti-abuse checks:

   * Rate limit by IP (basic)
   * Dedupe by `email_normalized` and/or `address_fingerprint` within campaign
5. If campaign at capacity:

   * If strict: reject with “full”
6. Insert claim:

   * status = `confirmed` if no email verification
   * status = `pending` if verification required
7. If verification required:

   * create verification token
   * send Mailgun email with verify link
8. Return response with next UI state

### `GET /api/verify?token=...`

Confirms email:

1. Hash token, lookup record, ensure not expired/used
2. Update claim status to `confirmed`, set `confirmed_at`
3. Mark token used

### `GET /api/campaigns/[slug]/stats`

Returns public stats for scarcity UI:

* confirmed_count
* capacity_total
* remaining

Admin routes (protected):

* `POST /api/admin/campaigns` create campaign
* `PATCH /api/admin/campaigns/[id]` update
* `GET /api/admin/campaigns/[id]/claims` list + filters
* `GET /api/admin/campaigns/[id]/export.csv` csv export

---

## 8) Admin Dashboard Requirements

### Admin Pages

* `/admin/login` (Supabase magic link)
* `/admin` list campaigns + basic stats
* `/admin/campaigns/[id]`

  * edit campaign settings
  * view claims table (filter by status, date, email)
  * export CSV
  * quick actions: mark shipped / reject

CSV export columns:

* campaign slug
* status
* name
* email
* company/title/phone
* full address
* created_at, confirmed_at

---

## 9) Privacy + Compliance (Practical, Minimal)

* On campaign page, clear statement:

  * “We only use your address to ship the book/voucher.”
  * “We won’t sell your information.”
* Data retention:

  * Admin can delete claims after fulfillment window (manual button is fine)
* Store `ip_hash` only (hash it, don’t store raw IP)

---

## 10) Anti-Abuse + Data Quality

Minimum viable:

* Normalize email (lowercase, trim)
* Generate `address_fingerprint` = hash(normalized name + address)
* Reject exact duplicates per campaign (or treat as update)
* Rate limit: simple in-memory per serverless instance is weak; better:

  * store per-day IP counts in DB table `rate_limits` (optional)
* Add honeypot field (hidden input) to block bots

---

## 11) UI Components (Tailwind)

* Campaign layout (clean, trusted look)
* Configurable form renderer
* Success states:

  * “Confirmed” (if no verification)
  * “Check your email” (if verification enabled)
  * “Campaign full”
  * “Invalid code”
* Scarcity bar (optional)

---

## 12) Environment Variables

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (server only)
* `ADMIN_EMAIL_ALLOWLIST` (comma-separated)
* Mailgun (only if verification on):

  * `MAILGUN_API_KEY`
  * `MAILGUN_DOMAIN`
  * `MAILGUN_FROM_EMAIL`
  * `APP_BASE_URL` (for verify links)

---

## 13) Build Tasks (Claude Code Checklist)

### Phase 1 — Foundation

* [ ] Create Next.js app (TS, Tailwind)
* [ ] Supabase project setup + migrations for tables
* [ ] RLS policies + admin allowlist pattern
* [ ] Seed example campaign(s)

### Phase 2 — Public Campaign Flow

* [ ] `/c/[slug]` page (fetch campaign config + render)
* [ ] Form component with config-driven fields
* [ ] Client + server validation
* [ ] `POST /api/campaigns/[slug]/claim`
* [ ] Success states + error states
* [ ] Scarcity stats endpoint + UI (toggle)

### Phase 3 — Optional Verification + Codes

* [ ] Email verification table + token logic
* [ ] Mailgun send function + templates
* [ ] `/verify` handler + confirmation screen
* [ ] Invite code table + validation logic (toggle)

### Phase 4 — Admin Dashboard

* [ ] Supabase auth login + route protection
* [ ] Campaign list + create/edit
* [ ] Claims table + filters
* [ ] CSV export endpoint

### Phase 5 — Hardening

* [ ] Dedupe rules + address fingerprinting
* [ ] Honeypot + basic rate limiting
* [ ] Logging + audit fields
* [ ] Basic tests for API routes

---

## 14) No Duplicate addresses




