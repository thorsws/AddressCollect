# Campaign Giveaway System

A Next.js application for managing campaign giveaway pages to collect shipping addresses with custom OTP-based admin authentication.

## Features

### Admin Features
- **Custom OTP Authentication** via Mailgun (NO Supabase Auth)
- **Campaign Management**: Create and manage multiple campaigns
- **Address Collection**: Collect up to 650+ shipping addresses per campaign
- **Email Verification**: Optional email verification for claimants
- **Invite Codes**: Optional invite code system with usage limits
- **Scarcity Display**: Show remaining slots to create urgency
- **CSV Export/Import**: Export all addresses or import manually
- **Address Deduplication**: Automatic duplicate detection
- **Rate Limiting**: Protect against abuse

### Public Features
- **Campaign Landing Pages**: Clean, trust-focused design at `/c/[slug]`
- **Configurable Forms**: Dynamic forms based on campaign settings
- **Privacy Focus**: Clear privacy messaging
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Email**: Mailgun
- **Hosting**: Vercel-ready

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Mailgun account with verified domain

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Configuration
ADMIN_EMAIL_ALLOWLIST=admin@example.com,another@example.com

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# Application Configuration
APP_BASE_URL=http://localhost:3000

# Optional
ADMIN_SESSION_TTL_DAYS=7
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. (Optional) Run seed data: `supabase/migrations/002_seed_data.sql`

This creates the following tables:
- `admin_otp_requests` - OTP authentication data
- `admin_sessions` - Admin session management
- `campaigns` - Campaign configurations
- `claims` - Address submissions
- `invite_codes` - Invite code system
- `email_verifications` - Email verification tokens

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Admin Access

1. **Login**: Visit `/admin/login`
2. **Enter Email**: Enter an email from the allowlist
3. **Check Email**: You'll receive a 6-digit OTP code
4. **Enter OTP**: Enter the code to log in

### Creating a Campaign

After running the seed data, you'll have test campaigns:
- `/c/stanford` - Basic campaign with email required
- `/c/partner-event` - Campaign with invite codes and verification

To create new campaigns, you can:
1. Insert directly into the database via SQL
2. (Coming soon) Use the admin UI campaign creator

### Viewing Claims

- **Dashboard**: See all campaigns at `/admin`
- **Campaign Claims**: Click "View Claims" on any campaign
- **All Addresses**: Click "View All Addresses" from dashboard
- **Export CSV**: Download claims data from any view

### Importing Addresses

1. Go to `/admin/addresses`
2. Click "Import CSV"
3. Select campaign slug and upload CSV file

**CSV Format:**
```csv
firstName,lastName,email,company,title,phone,address1,address2,city,region,postalCode,country
John,Doe,john@example.com,Acme Inc,CEO,555-1234,123 Main St,Apt 4,Springfield,IL,62701,US
```

Required fields: `firstName`, `lastName`, `address1`, `city`, `region`, `postalCode`, `country`

### Public Campaign Pages

Share your campaign URL: `https://yourdomain.com/c/[slug]`

Users can:
1. Fill out the address form
2. Submit their claim
3. Verify email (if required)
4. See confirmation

## Security Features

### Admin Authentication
- **OTP-based**: One-time passwords sent via email
- **Email Allowlist**: Only approved emails can access admin
- **Session Management**: Secure httpOnly cookies
- **Rate Limiting**: Max 3 OTP requests per email per hour

### Public Submissions
- **Address Deduplication**: Fingerprinting prevents duplicates
- **Rate Limiting**: Max 5 submissions per IP per day (configurable)
- **IP Hashing**: IPs are hashed for privacy
- **Input Validation**: Server-side validation of all fields

## Project Structure

```
/app
  /admin                  # Admin dashboard
    /login               # OTP login page
    /addresses           # All addresses view & import
    /campaigns/[id]      # Campaign details & claims
  /api
    /admin
      /auth              # OTP endpoints
      /campaigns         # Campaign management
      /addresses         # Import/export
    /campaigns/[slug]
      /claim             # Public claim submission
  /c/[slug]              # Public campaign pages
  /verify                # Email verification

/lib
  /admin                 # Admin helpers & session management
  /crypto                # Hashing & token generation
  /mailgun               # Email sending
  /supabase              # Database clients
  /utils                 # Utilities

/supabase
  /migrations            # Database schema
```

## Configuration

### Campaign Settings

Each campaign can be configured with:
- `require_email`: Require email address
- `require_email_verification`: Send verification email
- `require_invite_code`: Require invite code
- `show_scarcity`: Display remaining slots
- `collect_company`: Collect company field
- `collect_phone`: Collect phone field
- `collect_title`: Collect title/role field
- `capacity_total`: Maximum number of claims
- `max_claims_per_email`: Limit claims per email
- `max_claims_per_ip_per_day`: Rate limit per IP

## API Endpoints

### Admin Auth
- `POST /api/admin/auth/request-otp` - Request OTP
- `POST /api/admin/auth/verify-otp` - Verify OTP and create session
- `POST /api/admin/auth/logout` - Logout and revoke session

### Public
- `POST /api/campaigns/[slug]/claim` - Submit claim
- `GET /verify?token=...` - Verify email

### Admin Protected
- `GET /api/admin/campaigns/[id]/export` - Export campaign CSV
- `GET /api/admin/addresses/export` - Export all addresses CSV
- `POST /api/admin/addresses/import` - Import addresses from CSV

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to update:
- `APP_BASE_URL` to your production domain
- Set `NODE_ENV=production` (Vercel does this automatically)
- Enable secure cookies (automatic in production)

## Troubleshooting

### OTP Email Not Received
- Check Mailgun dashboard for delivery logs
- Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`
- Check spam folder
- Ensure sender domain is verified in Mailgun

### Admin Can't Login
- Verify email is in `ADMIN_EMAIL_ALLOWLIST`
- Check that allowlist uses comma separation
- Ensure no extra spaces in email addresses

### Database Errors
- Verify Supabase environment variables
- Check that migrations have been run
- Ensure service role key is used (not anon key) for admin operations

## Contributing

This is a custom implementation. For issues or questions, contact the development team.

## License

Private/Proprietary
