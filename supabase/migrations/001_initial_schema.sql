-- 001_initial_schema.sql
-- Competitor Tracking Dashboard — full schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Signal categories
CREATE TABLE signal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO signal_categories (name, is_default) VALUES
  ('Fundraising', true),
  ('Hiring', true),
  ('Leadership', true),
  ('Partnership', true),
  ('Launch', true),
  ('Pilot/Customer', true),
  ('Plant/Infrastructure', true),
  ('Positioning', true),
  ('Regulatory/IP', true),
  ('Media/PR', true),
  ('Litigation', true);

-- Competitors
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('direct', 'indirect')),
  one_liner TEXT,
  strategic_context TEXT,
  additional_context TEXT,
  website_url TEXT,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor analyses
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  analysis_json JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor tracked sources
CREATE TABLE competitor_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_label TEXT NOT NULL CHECK (source_label IN ('linkedin', 'twitter', 'blog', 'careers', 'crunchbase', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signals
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  category_id UUID REFERENCES signal_categories(id),
  date_observed DATE NOT NULL DEFAULT CURRENT_DATE,
  source_urls TEXT[],
  source_type TEXT NOT NULL CHECK (source_type IN ('official_announcement', 'news_article', 'linkedin', 'job_board', 'conversation', 'sec_regulatory', 'conference', 'other')),
  llm_summary TEXT,
  strategic_note TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  feedback TEXT CHECK (feedback IS NULL OR feedback IN ('up', 'down')),
  source TEXT NOT NULL CHECK (source IN ('automated', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signal comments
CREATE TABLE signal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lemnisca profile (single row)
CREATE TABLE lemnisca_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT,
  current_stage TEXT,
  differentiators TEXT,
  technology_focus TEXT,
  market_positioning TEXT,
  funding_status TEXT,
  team_strengths TEXT,
  strategic_priorities TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO lemnisca_profile (description) VALUES ('');

-- Indexes
CREATE INDEX idx_signals_competitor ON signals(competitor_id);
CREATE INDEX idx_signals_category ON signals(category_id);
CREATE INDEX idx_signals_date_observed ON signals(date_observed DESC);
CREATE INDEX idx_signals_is_read ON signals(is_read);
CREATE INDEX idx_competitor_analyses_competitor ON competitor_analyses(competitor_id);
CREATE INDEX idx_competitor_sources_competitor ON competitor_sources(competitor_id);
