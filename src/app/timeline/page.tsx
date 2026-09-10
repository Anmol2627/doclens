export const dynamic = 'force-dynamic';

import DashboardLayout from "@/components/dashboard-layout";
import { Activity, Clock, FileText, Pill, Stethoscope, ChevronRight, CheckCircle2, ExternalLink } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { format } from "date-fns";

export default async function TimelinePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || 'PATIENT';

  const { data: events } = await supabase
    .from('medical_events')
    .select('*, medical_documents(id, file_name, file_path)')
    .eq('patient_id', user?.id)
    .order('date', { ascending: false });

  // Generate signed URLs for documents
  const eventsWithUrls = await Promise.all(
    (events || []).map(async (event: any) => {
      if (event.medical_documents?.file_path) {
        const { data } = await supabase.storage
          .from('medical_documents')
          .createSignedUrl(event.medical_documents.file_path, 3600); // 1 hour
        return { ...event, signedUrl: data?.signedUrl || null };
      }
      return { ...event, signedUrl: null };
    })
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return <Stethoscope className="w-5 h-5" />;
      case 'LAB_TEST': return <Activity className="w-5 h-5" />;
      case 'IMAGING': return <Activity className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return 'bg-blue-500';
      case 'LAB_TEST': return 'bg-emerald-500';
      case 'IMAGING': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTextColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return 'text-blue-600';
      case 'LAB_TEST': return 'text-emerald-600';
      case 'IMAGING': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getEventBgColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return 'bg-blue-50';
      case 'LAB_TEST': return 'bg-emerald-50';
      case 'IMAGING': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <DashboardLayout userRole={userRole}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Your Health Timeline <span className="text-blue-500">⏳</span>
            </h2>
            <p className="text-gray-500 mt-1">Track the evolution of your health, test results, and medications over time.</p>
          </div>
          <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
            Filter Timeline <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Timeline Container */}
        <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          
          {(!eventsWithUrls || eventsWithUrls.length === 0) && (
             <div className="text-center text-gray-500 mt-10">No events found. Upload a document to build your timeline!</div>
          )}

          {eventsWithUrls.map((event: any, index: number) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-12">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${getEventColor(event.event_type)} text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative`}>
                {getEventIcon(event.event_type)}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] relative group-odd:pr-6 group-even:pl-6">
                {/* Connector line for large screens */}
                <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-6 h-[2px] bg-gray-200 group-odd:right-0 group-even:left-0 z-0"></div>
                
                <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {event.title}
                    </h4>
                    <time className={`text-sm font-bold ${getEventTextColor(event.event_type)} ${getEventBgColor(event.event_type)} px-2.5 py-1 rounded-full`}>
                      {event.date ? format(new Date(event.date), 'dd MMM yyyy') : 'Unknown Date'}
                    </time>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 font-medium">{event.description}</p>
                  
                  {event.document_id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <FileText className="w-4 h-4" /> {event.medical_documents?.file_name || 'Attached Document'}
                      </div>
                      {event.signedUrl ? (
                        <a
                          href={event.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm font-semibold ${getEventTextColor(event.event_type)} hover:opacity-80 flex items-center gap-1`}
                        >
                          View Report <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">No file available</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </DashboardLayout>
  )
}
