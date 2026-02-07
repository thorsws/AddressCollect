-- Add 'checkboxes' as a valid question type for multiple selection
-- Existing types: 'text' (free text), 'multiple_choice' (single selection)
-- New type: 'checkboxes' (multiple selection)

-- Drop the existing constraint
ALTER TABLE campaign_questions
DROP CONSTRAINT IF EXISTS campaign_questions_question_type_check;

-- Add new constraint with checkboxes support
ALTER TABLE campaign_questions
ADD CONSTRAINT campaign_questions_question_type_check
CHECK (question_type IN ('text', 'multiple_choice', 'checkboxes'));

COMMENT ON COLUMN campaign_questions.question_type IS 'Type of question: text (free text), multiple_choice (select one), checkboxes (select multiple)';
