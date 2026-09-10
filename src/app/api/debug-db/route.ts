import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  const { data: patientProfiles, error: ppError } = await supabase.from('patient_profiles').select('*');
  
  return NextResponse.json({
    profiles,
    pError,
    patientProfiles,
    ppError
  });
}
