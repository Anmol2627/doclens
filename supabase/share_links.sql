-- Run this in the Supabase SQL Editor to create the share_links table

CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  config JSONB DEFAULT '{}',
  include_documents BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow public (unauthenticated) read access for valid tokens (doctor portal)
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own share links
CREATE POLICY "Patient manage own share links" ON share_links
  FOR ALL USING (auth.uid() = patient_id);

-- Allow anonymous read for token validation (used by doctor portal API)
CREATE POLICY "Public read share links by token" ON share_links
  FOR SELECT USING (true);
