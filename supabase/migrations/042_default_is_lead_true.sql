-- Change default for is_lead back to false (everyone starts as NOT a lead, must be manually marked)
ALTER TABLE claims ALTER COLUMN is_lead SET DEFAULT false;
