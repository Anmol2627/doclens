import DashboardLayout from "@/components/dashboard-layout";
import { createClient } from '@/utils/supabase/server';
import ProfileForm from "./profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || 'PATIENT';

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, patient_profiles(*)')
    .eq('id', user.id)
    .single();

  const patientData = profile?.patient_profiles?.[0] || {};

  const initialData = {
    full_name: profile?.full_name || '',
    date_of_birth: patientData.date_of_birth || '',
    gender: patientData.gender || '',
    blood_group: patientData.blood_group || '',
    height_cm: patientData.height_cm?.toString() || '',
    weight_kg: patientData.weight_kg?.toString() || '',
    allergies: patientData.allergies?.join(', ') || ''
  };

  return (
    <DashboardLayout userRole={userRole}>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            My Profile <span className="text-emerald-500">👤</span>
          </h2>
          <p className="text-gray-500 mt-1">Manage your personal information and basic health details.</p>
        </div>
        
        <ProfileForm initialData={initialData} userId={user.id} />
      </div>
    </DashboardLayout>
  );
}
