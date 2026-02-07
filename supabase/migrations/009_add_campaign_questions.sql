-- Campaign questions table
CREATE TABLE campaign_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice')),
  is_required BOOLEAN DEFAULT false NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  options JSONB, -- For multiple choice: ["Option 1", "Option 2", "Option 3"]
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_campaign_questions_campaign_id ON campaign_questions(campaign_id);

-- Claim answers table
CREATE TABLE claim_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES campaign_questions(id) ON DELETE CASCADE,
  answer_text TEXT, -- For text questions or "other" responses
  answer_option TEXT, -- For multiple choice (the selected option)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(claim_id, question_id)
);

CREATE INDEX idx_claim_answers_claim_id ON claim_answers(claim_id);
CREATE INDEX idx_claim_answers_question_id ON claim_answers(question_id);

COMMENT ON TABLE campaign_questions IS 'Custom questions that can be added to campaigns';
COMMENT ON TABLE claim_answers IS 'Answers to custom questions submitted with claims';
