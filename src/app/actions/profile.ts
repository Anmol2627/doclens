'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Use Service Role Key to bypass RLS issues for the hackathon MVP
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveProfile(userId: string, formData: any) {
  try {
    // 1. Update profiles table (full_name)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: formData.full_name })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Format data for patient_profiles
    const patientData = {
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      blood_group: formData.blood_group || null,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : []
    };

    // 3. Update patient_profiles table (Bypass RLS)
    const { error: patientError } = await supabaseAdmin
      .from('patient_profiles')
      .upsert({ id: userId, ...patientData });

    if (patientError) throw patientError;

    // Invalidate caches globally
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving profile:', error);
    return { success: false, error: error.message };
  }
}

export async function getProfileWithAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('full_name, patient_profiles(*)')
    .eq('id', userId)
    .single();
    
  return data;
}
