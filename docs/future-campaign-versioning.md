# Future Feature: Campaign Versioning with Draft/Published States

**Status:** Planned (not yet implemented)
**Estimated effort:** 2-3 hours
**Priority:** Low - implement when needed

## Overview

Adding campaign versioning to enable:
- **Draft vs Published** - Work on changes without affecting live campaign
- **Version History** - Track all changes with timestamps and who made them
- **Revert** - Restore any previous version instantly
- **Claims Preserved** - All claims stay linked to the campaign (they reference `campaign_id`, not versions)

## Why This Design

1. **Claims reference `campaign_id`** (immutable) - not affected by version changes
2. **JSONB snapshot** - Store all mutable config as JSON for simplicity
3. **Draft mode** - Edit without affecting live users until you publish
4. **Simple revert** - Copy old version's config back to campaign table

## What Gets Versioned

All mutable campaign settings:
- Content: title, description, privacy_blurb, contact info
- Configuration: require_email, test_mode, kiosk_mode, etc.
- Limits: capacity_total, max_claims_per_email, etc.
- Timing: starts_at, ends_at
- Display: show_scarcity, show_banner, show_logo

## What Does NOT Get Versioned

- `id` - Primary key (claims reference this)
- `slug` - URL identifier (already immutable)
- `created_at`, `created_by` - Historical metadata
- `campaign_questions` - Separate table (could add versioning later)
- `invite_codes` - Separate table

---

## Database Schema Changes

### Migration: `025_add_campaign_versioning.sql`

```sql
-- Add versioning columns to campaigns
ALTER TABLE campaigns ADD COLUMN is_draft BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE campaigns ADD COLUMN published_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN current_version INTEGER DEFAULT 1 NOT NULL;

-- Create campaign_versions table for history
CREATE TABLE campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL, -- Snapshot of all mutable campaign fields
  change_summary TEXT, -- Optional description of what changed
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  is_published BOOLEAN DEFAULT false NOT NULL, -- Was this version published?
  UNIQUE(campaign_id, version_number)
);

CREATE INDEX idx_campaign_versions_campaign_id ON campaign_versions(campaign_id);
CREATE INDEX idx_campaign_versions_created_at ON campaign_versions(created_at DESC);

-- Create initial version for all existing campaigns
INSERT INTO campaign_versions (campaign_id, version_number, config, created_by, is_published, created_at)
SELECT
  id,
  1,
  jsonb_build_object(
    'title', title,
    'internal_title', internal_title,
    'description', description,
    'notes', notes,
    'capacity_total', capacity_total,
    'is_active', is_active,
    'test_mode', test_mode,
    'kiosk_mode', kiosk_mode,
    'require_email', require_email,
    'require_email_verification', require_email_verification,
    'require_invite_code', require_invite_code,
    'collect_company', collect_company,
    'collect_phone', collect_phone,
    'collect_title', collect_title,
    'enable_questions', enable_questions,
    'questions_intro_text', questions_intro_text,
    'show_scarcity', show_scarcity,
    'show_banner', show_banner,
    'banner_url', banner_url,
    'show_logo', show_logo,
    'starts_at', starts_at,
    'ends_at', ends_at,
    'privacy_blurb', privacy_blurb,
    'contact_email', contact_email,
    'contact_text', contact_text,
    'max_claims_per_email', max_claims_per_email,
    'max_claims_per_ip_per_day', max_claims_per_ip_per_day,
    'max_claims_per_address', max_claims_per_address
  ),
  created_by,
  true, -- All existing campaigns are published
  NOW()
FROM campaigns;

-- Update existing campaigns to published state
UPDATE campaigns SET published_at = NOW();

COMMENT ON TABLE campaign_versions IS 'Version history for campaign configurations';
COMMENT ON COLUMN campaigns.is_draft IS 'True if campaign has unpublished changes';
COMMENT ON COLUMN campaigns.current_version IS 'Current version number for this campaign';
```

---

## API Changes

### 1. Update Campaign Update API
**File: `/app/api/admin/campaigns/[id]/update/route.ts`**

When saving:
1. If saving as draft: Save changes to campaign table, set `is_draft = true`
2. If publishing (`publish: true` in request):
   - Save changes to campaign table
   - Create new version in `campaign_versions`
   - Increment `current_version`
   - Set `published_at = NOW()`
   - Set `is_draft = false`

### 2. New Version History API
**File: `/app/api/admin/campaigns/[id]/versions/route.ts`**

- `GET`: List all versions for a campaign (newest first)
- Returns: version_number, change_summary, created_at, created_by, is_published

### 3. New Revert API
**File: `/app/api/admin/campaigns/[id]/versions/[versionNumber]/revert/route.ts`**

- `POST`: Restore campaign config from specified version
- Copies version's `config` JSONB back to campaign table columns
- Creates a new version recording the revert
- Sets `is_draft = false`, updates `published_at`

---

## UI Changes

### 1. Campaign Edit Page
**File: `/app/admin/campaigns/[id]/edit/page.tsx`**

Add to header:
- **Status badge**: "Published" (green) or "Draft" (yellow)
- **Save as Draft** button - saves without publishing
- **Publish** button - saves and creates new version
- **Version history** link/dropdown

### 2. Version History Panel/Modal
**New component: `/app/admin/campaigns/[id]/edit/VersionHistory.tsx`**

Shows:
- List of all versions with timestamps
- Who made each change
- Change summary (if provided)
- "Revert to this version" button for each

### 3. Campaign List Page
**File: `/app/admin/page.tsx`**

- Add "Draft" badge next to campaigns with `is_draft = true`
- Help admins see which campaigns have unpublished changes

---

## User Flow

### Creating a Campaign
1. User creates campaign (starts as published, version 1)
2. All fields saved, version 1 created automatically

### Editing a Campaign
1. User opens campaign edit page
2. Makes changes
3. Options:
   - **Save as Draft**: Changes saved but not live (public form still uses last published config)
   - **Publish**: Changes go live, new version created

### Reverting to Previous Version
1. User opens version history
2. Selects a previous version
3. Confirms revert
4. Campaign config restored to that version
5. New version created recording the revert

---

## Files to Create/Modify

### New Files
- `/supabase/migrations/025_add_campaign_versioning.sql`
- `/app/api/admin/campaigns/[id]/versions/route.ts`
- `/app/api/admin/campaigns/[id]/versions/[versionNumber]/revert/route.ts`
- `/app/admin/campaigns/[id]/edit/VersionHistory.tsx`
- `/lib/utils/campaignVersion.ts` - Helper to extract/apply config

### Modified Files
- `/app/api/admin/campaigns/[id]/update/route.ts` - Add versioning logic
- `/app/admin/campaigns/[id]/edit/page.tsx` - Add version UI
- `/app/admin/campaigns/[id]/edit/EditCampaignForm.tsx` - Draft/publish buttons
- `/app/admin/page.tsx` - Show draft badges

---

## Testing Checklist

- [ ] Migration creates versions for existing campaigns
- [ ] Editing campaign creates draft state
- [ ] Publishing creates new version
- [ ] Revert restores previous config correctly
- [ ] Claims unaffected by version changes (still linked to campaign_id)
- [ ] Version history shows all changes
- [ ] Draft badge appears on dashboard

---

## Key Behavior: Draft Mode

When a campaign has unpublished changes (`is_draft = true`):
- **Admins** see the draft (current) settings in the edit form
- **Public users** see the last published version on the claim form
- This allows safe editing without affecting live campaigns
