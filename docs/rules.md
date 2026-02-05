

# Claude Code Rules — Campaign Giveaway App (Mailgun OTP, NO Supabase Auth)

## 0) Non-negotiables
- Do NOT use Supabase Auth.
- Use Mailgun to implement OTP login for admin.
- Public campaign pages require no login.
- Keep MVP simple and shippable.

## 1) Auth model (Admin only)
- Implement custom admin auth with:
  - OTP request endpoint
  - OTP verify endpoint
  - Secure session cookie
- Admin access is allowlisted by email via `ADMIN_EMAIL_ALLOWLIST` env var.

### Flow
1) Admin enters email on `/admin/login`
2) POST `/api/admin/auth/request-otp`
   - If email is allowlisted, generate OTP (6 digits) + store hash + expiration
   - Send OTP via Mailgun
3) Admin enters OTP
4) POST `/api/admin/auth/verify-otp`
   - Verify hash + expiration + attempts
   - Create session record
   - Set httpOnly secure cookie `admin_session`
5) Admin routes require valid session.

## 2) Session & OTP storage (Supabase Postgres)
Create tables:

### `admin_otp_requests`
- `id` uuid pk
- `email` text indexed
- `otp_hash` text
- `expires_at` timestamptz
- `attempts` int default 0
- `max_attempts` int default 5
- `used_at` timestamptz nullable
- `created_at` timestamptz default now()
- `ip_hash` text nullable

Rules:
- Store only hash of OTP (never raw OTP).
- Rate limit OTP requests per email and per IP.
- OTP expires in 10 minutes.

### `admin_sessions`
- `id` uuid pk
- `email` text indexed
- `session_token_hash` text unique
- `created_at` timestamptz default now()
- `expires_at` timestamptz
- `revoked_at` timestamptz nullable
- `ip_hash` text nullable
- `user_agent` text nullable

Rules:
- Cookie stores raw session token; DB stores hash.
- Session TTL: 7 days (configurable).
- Logout endpoint revokes session.

## 3) Security rules for OTP/session cookies
- Cookie must be:
  - httpOnly
  - secure (in production)
  - sameSite=lax
  - path=/
- Session verification must:
  - hash cookie token and match `admin_sessions.session_token_hash`
  - check `expires_at` and `revoked_at`

## 4) Supabase usage rules
- Use Supabase ONLY as Postgres database.
- All writes happen from server route handlers using `SUPABASE_SERVICE_ROLE_KEY`.
- Client never receives service role key.
- RLS can be enabled but is optional since all access is via service key.
  - If enabling RLS, keep it strict and only allow public read of campaign fields if needed.

## 5) Admin route protection
- Create a reusable server helper:
  - `/lib/admin/requireAdmin.ts`
  - Reads cookie, validates session, checks allowlist.
- All `/api/admin/*` routes must call `requireAdmin`.

## 6) Campaign behavior (unchanged)
- Address fields always required.
- Email collection can be optional/required per campaign.
- Email verification for claimants is optional per campaign (separate from admin OTP).
- Scarcity display and invite code remain campaign-configurable.

## 7) Mailgun rules
- All Mailgun logic lives in `/lib/mailgun`.
- Implement:
  - `sendAdminOtpEmail(email, otp, campaign?)`
  - (optional) `sendClaimVerificationEmail(email, link)`
- Do not log OTP or raw tokens.

## 8) Rate limiting (MVP-friendly)
Implement simple DB-based throttles:
- OTP request limits:
  - Max 3 OTP sends per email per hour
  - Max 10 OTP sends per IP per hour
- OTP verify limits:
  - Max attempts per OTP record (default 5), then lock

## 9) API endpoints (Admin auth)
- `POST /api/admin/auth/request-otp`
  Body: { email: string }
  Returns: { ok: true }
- `POST /api/admin/auth/verify-otp`
  Body: { email: string, otp: string }
  Returns: { ok: true }
  Side effect: sets cookie
- `POST /api/admin/auth/logout`
  Returns: { ok: true } and clears cookie

## 10) Definition of done
- Admin can log in with OTP via Mailgun.
- Admin can create/edit campaigns.
- Public can submit claims.
- Admin can view/export claims.
- No Supabase Auth used anywhere.
```

### Env vars to add

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY

* `ADMIN_EMAIL_ALLOWLIST` (comma-separated)
* `MAILGUN_API_KEY`
* `MAILGUN_DOMAIN`
* `MAILGUN_FROM_EMAIL`
* `APP_BASE_URL`
* `ADMIN_SESSION_TTL_DAYS` (optional)

