export const dynamic = 'force-dynamic';

import DashboardLayout from "@/components/dashboard-layout";
import { HandoffActions } from "@/components/handoff-actions";
import { FileText, User, Activity, AlertTriangle, Pill } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { format } from "date-fns";
import { getProfileWithAdmin } from '@/app/actions/profile';

export default async function HandoffPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || 'PATIENT';

  const [{ data: findings }, { data: medications }, { data: investigations }, profileData] = await Promise.all([
    supabase.from('medical_findings').select('*').eq('patient_id', user?.id),
    supabase.from('medications').select('*').eq('patient_id', user?.id),
    supabase.from('investigations').select('*').eq('patient_id', user?.id).order('date', { ascending: false }),
    getProfileWithAdmin(user?.id || '')
  ]);

  const rawProfile = profileData?.patient_profiles;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] || {} : rawProfile || {};
  const fullName = profileData?.full_name || 'Patient';
  const age = profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 'Unknown';

  const activeFindings = findings?.filter((f: any) => f.status === 'ACTIVE') || [];
  const activeMedications = medications?.filter((m: any) => m.status === 'ACTIVE') || [];
  const recentInvestigations = investigations?.slice(0, 5) || [];

  return (
    <DashboardLayout userRole={userRole}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Clinical Handoff Report <span className="text-blue-500">📄</span>
            </h2>
            <p className="text-gray-500 mt-1">A consolidated summary of your health profile for your healthcare provider.</p>
          </div>
          <HandoffActions />
        </div>

        <div id="handoff-report" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          
          {/* Document Header */}
          <div className="bg-slate-900 text-white p-8 print:bg-slate-900 print:text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-1">Patient Summary Report</h1>
                <p className="text-slate-400 text-sm">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{fullName}</div>
                <div className="text-slate-400 text-sm">DOB / Age: {age} yrs</div>
                <div className="text-slate-400 text-sm">Gender: {profile.gender || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Vitals & Demographics */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Demographics &amp; Vitals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Blood Group</div>
                  <div className="font-bold text-slate-900">{profile.blood_group || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Height</div>
                  <div className="font-bold text-slate-900">{profile.height_cm ? `${profile.height_cm} cm` : 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Weight</div>
                  <div className="font-bold text-slate-900">{profile.weight_kg ? `${profile.weight_kg} kg` : 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Allergies</div>
                  <div className="font-bold text-red-600">{profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'None Known'}</div>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Active Problems */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Problems
              </h3>
              {activeFindings.length > 0 ? (
                <ul className="space-y-3">
                  {activeFindings.map((finding: any) => (
                    <li key={finding.id} className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                      <div>
                        <div className="font-bold text-slate-900">{finding.condition}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic text-sm">No active problems identified.</p>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* Current Medications */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" /> Current Medications
              </h3>
              {activeMedications.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Medication</th>
                        <th className="px-4 py-3 font-medium">Dosage</th>
                        <th className="px-4 py-3 font-medium">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeMedications.map((med: any) => (
                        <tr key={med.id}>
                          <td className="px-4 py-3 font-bold text-slate-900">{med.name}</td>
                          <td className="px-4 py-3 text-gray-600">{med.dosage || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{med.frequency || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No active medications identified.</p>
              )}
            </section>

            <hr className="border-gray-100" />

            {/* Recent Investigations */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Recent Investigations
              </h3>
              {recentInvestigations.length > 0 ? (
                <div className="space-y-4">
                  {recentInvestigations.map((inv: any) => (
                    <div key={inv.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex justify-between mb-2">
                        <div className="font-bold text-slate-900">{inv.test_name}</div>
                        <div className="text-sm text-gray-500 font-medium">
                          {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : 'Unknown Date'}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Result: </span>
                        <span className="font-bold text-slate-800">{inv.value || 'Available in report'}</span>
                        {inv.unit && <span className="text-gray-500"> {inv.unit}</span>}
                        {inv.reference_range && <span className="text-gray-400 text-xs ml-2">(Ref: {inv.reference_range})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No recent investigations found.</p>
              )}
            </section>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block p-8 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>Generated by DocLens • {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
            <p className="mt-1">This report was auto-generated from uploaded medical documents.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
