-- Missing Context Supabase Schema
-- Run this in the Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Base user table)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PATIENT PROFILES
CREATE TABLE patient_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  allergies TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DOCTOR PROFILES
CREATE TABLE doctor_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialty TEXT,
  hospital_affiliation TEXT,
  registration_number TEXT,
  verified BOOLEAN DEFAULT false
);

-- 4. MEDICAL DOCUMENTS
CREATE TABLE medical_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'EXTRACTING', 'OCR', 'ANALYZING', 'BUILDING_CONTEXT', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW')),
  document_type TEXT DEFAULT 'UNKNOWN' CHECK (document_type IN ('PRESCRIPTION', 'LAB_REPORT', 'IMAGING_REPORT', 'CONSULTATION_NOTE', 'DISCHARGE_SUMMARY', 'MEDICAL_CERTIFICATE', 'OTHER', 'UNKNOWN')),
  document_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. DOCUMENT PAGES
CREATE TABLE document_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_path TEXT, -- Optional path if we generate page images
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. MEDICAL FINDINGS / CONDITIONS
CREATE TABLE medical_findings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  condition TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  first_noted_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. MEDICATIONS
CREATE TABLE medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  status TEXT DEFAULT 'ACTIVE',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. INVESTIGATIONS (Lab Results, etc)
CREATE TABLE investigations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  test_name TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  reference_range TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. MEDICAL EVENTS (Timeline)
CREATE TABLE medical_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  event_type TEXT NOT NULL, -- 'CONSULTATION', 'LAB_TEST', 'IMAGING', 'PROCEDURE', 'HOSPITALIZATION'
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  document_id UUID REFERENCES medical_documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. WHAT CHANGED (Changes tracked over time)
CREATE TABLE medical_changes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  entity_type TEXT NOT NULL, -- 'MEDICATION', 'LAB_VALUE', 'FINDING'
  entity_name TEXT NOT NULL, 
  change_type TEXT NOT NULL, -- 'NEW', 'REMOVED', 'INCREASED', 'DECREASED', 'STABLE', 'MODIFIED'
  old_value TEXT,
  new_value TEXT,
  trend TEXT, -- 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'NEEDS_ATTENTION'
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. CONTEXT GAPS
CREATE TABLE context_gaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
  status TEXT DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED', 'DISMISSED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. EVIDENCE REFERENCES
CREATE TABLE evidence_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  target_table TEXT NOT NULL, -- The table containing the insight (e.g., 'medical_changes')
  target_id UUID NOT NULL, -- The ID of the insight
  document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE,
  page_number INTEGER,
  source_text TEXT,
  bounding_box JSONB, -- [x, y, width, height]
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. SHARED CONTEXTS (Patient -> Doctor sharing)
CREATE TABLE shared_contexts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  doctor_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
  config JSONB NOT NULL, -- { overview: true, history: true, medications: true, ... }
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. SHARED DOCUMENTS
CREATE TABLE shared_documents (
  shared_context_id UUID REFERENCES shared_contexts(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (shared_context_id, document_id)
);

-- 15. HANDOFF REPORTS
CREATE TABLE handoff_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shared_context_id UUID REFERENCES shared_contexts(id) NOT NULL,
  patient_id UUID REFERENCES profiles(id) NOT NULL,
  doctor_id UUID REFERENCES profiles(id) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---
-- ROW LEVEL SECURITY (RLS)
-- ---

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Base Policies (Hackathon simplified but secure)
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Patient data access policies
-- Function to check if a doctor has active access to a patient
CREATE OR REPLACE FUNCTION doctor_has_access(patient_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_contexts 
    WHERE patient_id = patient_uuid 
    AND doctor_id = auth.uid() 
    AND status = 'ACTIVE'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Patients can access their own data. Doctors can access if shared.
CREATE POLICY "Patient self access, Doctor shared access" ON medical_documents 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON document_pages 
  FOR SELECT USING (
    document_id IN (SELECT id FROM medical_documents WHERE patient_id = auth.uid() OR doctor_has_access(patient_id))
  );
CREATE POLICY "Patient self access, Doctor shared access" ON medical_findings 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON medications 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON investigations 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON medical_events 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON medical_changes 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON context_gaps 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));
CREATE POLICY "Patient self access, Doctor shared access" ON evidence_references 
  FOR SELECT USING (auth.uid() = patient_id OR doctor_has_access(patient_id));

-- Patients can insert/update their own data
CREATE POLICY "Patient insert own data" ON medical_documents FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient update own data" ON medical_documents FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Patient insert own data" ON document_pages FOR INSERT WITH CHECK (
  document_id IN (SELECT id FROM medical_documents WHERE patient_id = auth.uid())
);
CREATE POLICY "Patient insert own data" ON medical_findings FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON medications FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON investigations FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON medical_events FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON medical_changes FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON context_gaps FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient insert own data" ON evidence_references FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Shared Contexts
CREATE POLICY "Patients view own shared contexts" ON shared_contexts FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Patients manage own shared contexts" ON shared_contexts FOR ALL USING (auth.uid() = patient_id);

-- Storage bucket definition
INSERT INTO storage.buckets (id, name, public) VALUES ('medical_documents', 'medical_documents', false) ON CONFLICT DO NOTHING;

-- Storage RLS (Requires storage policies mapping to our DB logic)
-- Create policy to allow patients to upload and view own docs
-- Create policy to allow doctors to view docs shared with them
CREATE POLICY "Patient upload docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical_documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Patient view own docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Trigger to automatically create a profile after auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- We assume 'role' and 'full_name' are passed via raw_user_meta_data during signup
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'PATIENT'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.email
  );
  
  IF (new.raw_user_meta_data->>'role' = 'PATIENT') THEN
    INSERT INTO public.patient_profiles (id) VALUES (new.id);
  ELSIF (new.raw_user_meta_data->>'role' = 'DOCTOR') THEN
    INSERT INTO public.doctor_profiles (id) VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
