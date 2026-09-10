-- Run this in the Supabase SQL Editor to fix the Row Level Security error

-- Allow patients to view their own profile
CREATE POLICY "Users can view own patient profile" ON patient_profiles 
  FOR SELECT USING (auth.uid() = id);

-- Allow patients to update their own profile
CREATE POLICY "Users can update own patient profile" ON patient_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Allow patients to insert (upsert) their own profile
CREATE POLICY "Users can insert own patient profile" ON patient_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
