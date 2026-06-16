-- Supabase SQL: Create resumes table
-- Run this in Supabase Dashboard > SQL Editor
-- Make sure to run DROP TABLE IF EXISTS resumes; first if developing

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  
  name TEXT NOT NULL DEFAULT 'Unknown',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  github TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  
  skills JSONB DEFAULT '[]'::jsonb,
  experience TEXT DEFAULT 'Not specified',
  experience_years INTEGER DEFAULT 0,
  education JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  
  predicted_role TEXT DEFAULT 'Unknown',
  ats_score INTEGER DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  ats_breakdown JSONB DEFAULT '{}'::jsonb,
  feedback JSONB DEFAULT '{}'::jsonb,
  confidence REAL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  entities JSONB DEFAULT '[]'::jsonb,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, disable for dev)
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and reads (matches anon key usage)
CREATE POLICY "Allow anonymous insert" ON resumes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON resumes
  FOR SELECT USING (true);

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at DESC);
