import DashboardLayout from "@/components/dashboard-layout";
import { Upload, FileText, Share2, Search, ArrowRight, Activity, Link as LinkIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For MVP, we'll fetch profile later, assume PATIENT for now or read from user metadata
  const userRole = user?.user_metadata?.role || 'PATIENT';
  const fullName = user?.user_metadata?.full_name || 'Rahul Sharma';
  const firstName = fullName.split(' ')[0];

  if (userRole === 'DOCTOR') {
    return (
      <DashboardLayout userRole="DOCTOR">
        <div>Doctor Dashboard Implementation pending...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="PATIENT">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Good morning, {firstName} 👋</h2>
            <p className="text-gray-500 mt-1">Take charge of your health journey. Your records, your context, always with you.</p>
          </div>
          <div className="text-right">
            <p className="italic text-emerald-700 font-serif">&quot;Better records.<br/>Brighter tomorrows.&quot;</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col justify-between row-span-2 col-span-1">
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">82%</div>
              <h3 className="font-semibold text-slate-900">Profile Completeness</h3>
              <p className="text-xs text-gray-500 mt-2">Add a few more details to get a more personalized experience.</p>
            </div>
            <button className="w-full bg-emerald-100 text-emerald-700 rounded-lg py-2 text-sm font-medium hover:bg-emerald-200 mt-4">
              Complete Profile &rarr;
            </button>
          </div>

          <Link href="/upload" className="bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 border border-gray-100 transition-colors flex flex-col group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Upload Records</h3>
            <p className="text-xs text-gray-500 flex-1">Add reports, prescriptions, scans and more.</p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors self-end" />
          </Link>

          <Link href="/context" className="bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-6 border border-gray-100 transition-colors flex flex-col group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">View My Health Context</h3>
            <p className="text-xs text-gray-500 flex-1">See AI-organized summary of your health history.</p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors self-end" />
          </Link>

          <Link href="/share" className="bg-orange-50/50 hover:bg-orange-50 rounded-2xl p-6 border border-gray-100 transition-colors flex flex-col group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm mb-4">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Share with Doctor</h3>
            <p className="text-xs text-gray-500 flex-1">Choose what to share and generate a clinical handoff.</p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors self-end" />
          </Link>

          <Link href="/doctors" className="bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-6 border border-gray-100 transition-colors flex flex-col group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-500 shadow-sm mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Find Doctors</h3>
            <p className="text-xs text-gray-500 flex-1">Discover and connect with trusted doctors.</p>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors self-end" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Records */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Recent Records</h3>
              <Link href="/records" className="text-emerald-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {/* Dummy data for UI */}
              {[
                { name: 'Blood Report - Aug 2026', type: 'Lab Report', date: '2 days ago', icon: <FileText className="w-4 h-4 text-red-500"/> },
                { name: 'Prescription - Jul 2026', type: 'Prescription', date: '2 weeks ago', icon: <FileText className="w-4 h-4 text-blue-500"/> },
                { name: 'MRI Scan - Jan 2026', type: 'Imaging Report', date: '1 month ago', icon: <Activity className="w-4 h-4 text-purple-500"/> },
              ].map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type} • {item.date}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">⋮</button>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Your Health Timeline (Recent)</h3>
              <Link href="/timeline" className="text-emerald-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                {/* Timeline Item 1 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900">Blood test conducted</h4>
                      <time className="text-xs font-medium text-emerald-600">12 Aug 2026</time>
                    </div>
                    <p className="text-sm text-gray-500">HbA1c, Lipid Profile, CBC</p>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900">Follow-up consultation</h4>
                      <time className="text-xs font-medium text-blue-600">28 Jul 2026</time>
                    </div>
                    <p className="text-sm text-gray-500">Routine follow-up, medication continued</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Bar */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6 flex flex-col md:flex-row gap-6">
          <div className="shrink-0 flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
               ✨
             </div>
             <div>
               <h3 className="font-bold text-slate-900">AI Insights</h3>
               <p className="text-xs text-gray-600">Quick highlights from your recent records.</p>
             </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-red-600">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Key Conditions</span>
              </div>
              <ul className="text-sm font-medium text-slate-800 list-disc list-inside">
                <li>Type 2 Diabetes Mellitus</li>
                <li>Hypertension</li>
              </ul>
            </div>
            
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <LinkIcon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Current Medications</span>
              </div>
              <ul className="text-sm font-medium text-slate-800 list-disc list-inside">
                <li>Metformin 500 mg (BD)</li>
                <li>Amlodipine 5 mg (OD)</li>
              </ul>
            </div>
            
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Recent Change</span>
              </div>
              <p className="text-sm font-medium text-slate-800">HbA1c improved from 8.2% &rarr; 7.1%</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                Positive trend
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

