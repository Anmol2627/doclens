export const dynamic = 'force-dynamic';

import DashboardLayout from "@/components/dashboard-layout";
import { Activity, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import { getProfileWithAdmin } from '@/app/actions/profile';

export default async function MedicalContextPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || 'PATIENT';

  const [{ data: findings }, { data: medications }, { data: investigations }, { data: documents }, profileData] = await Promise.all([
    supabase.from('medical_findings').select('*').eq('patient_id', user?.id),
    supabase.from('medications').select('*').eq('patient_id', user?.id),
    supabase.from('investigations').select('*').eq('patient_id', user?.id).order('date', { ascending: false }),
    supabase.from('medical_documents').select('*').eq('patient_id', user?.id),
    getProfileWithAdmin(user?.id || '')
  ]);

  const rawPatient = profileData?.patient_profiles;
  const profile = Array.isArray(rawPatient) ? rawPatient[0] || {} : rawPatient || {};
  const fullName = profileData?.full_name || 'Patient';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

  const activeFindings = findings?.filter((f: any) => f.status === 'ACTIVE') || [];
  const activeMedications = medications?.filter((m: any) => m.status === 'ACTIVE') || [];

  return (
    <DashboardLayout userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Your Medical Context <span className="text-emerald-500">✨</span>
            </h2>
            <p className="text-gray-500 mt-1">An AI-organized summary of your health history, built from your uploaded records.</p>
          </div>
          <Link href="/timeline" className="px-4 py-2 bg-white border border-gray-200 text-slate-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
            <ClockIcon /> View Timeline
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">{fullName}</h3>
                <p className="text-sm text-gray-500 mt-1">{profile.gender || 'Unknown'} • Blood Group: {profile.blood_group || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Allergies: {profile.allergies ? profile.allergies.join(', ') : 'None'}</div>
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Height: {profile.height_cm || 'N/A'} cm</div>
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Weight: {profile.weight_kg || 'N/A'} kg</div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <span className="text-xl">✨</span> AI Summary
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded">AI Generated</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed relative z-10">
                Based on your uploaded documents, you have {activeFindings.length} active conditions. You are taking {activeMedications.length} medications. Please keep your records updated for the most accurate insights.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col group relative overflow-hidden hover:border-red-200 hover:shadow-md transition-all cursor-pointer">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conditions</span>
                <div className="text-2xl font-bold text-slate-900 mb-2">{activeFindings.length}</div>
                <ul className="text-xs font-medium text-slate-700 space-y-1 list-disc list-inside flex-1">
                  {activeFindings.slice(0,3).map((f:any) => <li key={f.id} className="truncate">{f.condition}</li>)}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col group relative overflow-hidden hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Medications</span>
                <div className="text-2xl font-bold text-slate-900 mb-2">{activeMedications.length}</div>
                <ul className="text-xs font-medium text-slate-700 space-y-1 list-disc list-inside flex-1">
                  {activeMedications.slice(0,3).map((m:any) => <li key={m.id} className="truncate">{m.name}</li>)}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col group relative overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Investigations</span>
                <div className="text-2xl font-bold text-slate-900 mb-2">{investigations?.length || 0}</div>
                <ul className="text-xs font-medium text-slate-700 space-y-1 list-disc list-inside flex-1">
                  {investigations?.slice(0,3).map((i:any) => <li key={i.id} className="truncate">{i.test_name}</li>)}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col group relative overflow-hidden hover:border-purple-200 hover:shadow-md transition-all cursor-pointer">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Records</span>
                <div className="text-2xl font-bold text-slate-900 mb-2">{documents?.length || 0}</div>
              </div>
            </div>
            
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group cursor-pointer">
              <h3 className="font-bold text-lg mb-2 relative z-10">Generate Handoff</h3>
              <p className="text-sm text-slate-300 mb-6 relative z-10 leading-relaxed">
                Create a concise, AI-summarized clinical report for your doctor with just the right context.
              </p>
              <Link href="/handoff">
                <button className="w-full py-2.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors relative z-10 flex justify-center items-center gap-2">
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
}
