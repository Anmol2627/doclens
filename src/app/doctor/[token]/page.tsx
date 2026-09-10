'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Activity, FileText, Pill, Stethoscope, AlertTriangle, User, Shield, Clock, ExternalLink, Loader2, XCircle, Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'zh', label: '台灣 (Taiwanese)' },
];

interface PatientData {
  patient: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    heightCm?: number;
    weightKg?: number;
    allergies?: string[];
  };
  findings: any[];
  medications: any[];
  investigations: any[];
  events: any[];
  documents: any[];
  config: any;
  expiresAt: string;
}

export default function DoctorPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PatientData | null>(null);
  const [displayData, setDisplayData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Invalid or expired link');
          return;
        }
        const json = await res.json();
        setData(json);
        setDisplayData(json);
      } catch (e: any) {
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const handleLanguageChange = async (lang: string) => {
    setCurrentLang(lang);
    
    if (lang === 'en') {
      // Revert to original English data
      setDisplayData(data);
      return;
    }

    if (!data) return;

    setTranslating(true);
    try {
      const payload = {
        findings: data.findings,
        medications: data.medications,
        investigations: data.investigations,
        events: data.events,
      };

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, targetLang: lang }),
      });

      if (res.ok) {
        const translated = await res.json();
        setDisplayData({
          ...data,
          findings: translated.findings || data.findings,
          medications: translated.medications || data.medications,
          investigations: translated.investigations || data.investigations,
          events: translated.events || data.events,
        });
      } else {
        console.error('Translation request failed');
        setDisplayData(data);
      }
    } catch (e) {
      console.error('Translation error:', e);
      setDisplayData(data);
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !displayData) return null;

  const { patient, config, expiresAt, documents } = data;
  const { findings, medications, investigations, events } = displayData;
  const activeFindings = findings.filter((f: any) => f.status === 'ACTIVE');
  const activeMedications = medications.filter((m: any) => m.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-emerald-600 text-white py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Secure Patient Portal — shared by the patient
          </div>
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-emerald-700/50 rounded-lg px-3 py-1.5">
              <Globe className="w-4 h-4 text-emerald-200" />
              <select
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer appearance-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Clock className="w-4 h-4" />
              Expires: {format(new Date(expiresAt), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Translation overlay */}
      {translating && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-900 text-lg">Translating Report...</p>
            <p className="text-gray-500 text-sm mt-1">Converting medical data to {LANGUAGES.find(l => l.code === currentLang)?.label}</p>
          </div>
        </div>
      )}

      {/* Translation Notice */}
      {currentLang !== 'en' && !translating && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
            <Globe className="w-5 h-5 text-amber-600 shrink-0" />
            <span>This report has been translated to {LANGUAGES.find(l => l.code === currentLang)?.label} using AI. Please refer to original English records for clinical accuracy.</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

        {/* Patient Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                {patient.fullName?.charAt(0) || 'P'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{patient.fullName}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  {patient.dateOfBirth && <span>DOB: {format(new Date(patient.dateOfBirth), 'dd MMM yyyy')}</span>}
                  {patient.gender && <span>{patient.gender}</span>}
                  {patient.bloodGroup && <span>Blood: {patient.bloodGroup}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Blood Group</div>
              <div className="font-bold text-slate-900">{patient.bloodGroup || 'N/A'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Height</div>
              <div className="font-bold text-slate-900">{patient.heightCm ? `${patient.heightCm} cm` : 'N/A'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Weight</div>
              <div className="font-bold text-slate-900">{patient.weightKg ? `${patient.weightKg} kg` : 'N/A'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Allergies</div>
              <div className="font-bold text-red-600">{patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None Known'}</div>
            </div>
          </div>
        </div>

        {/* Active Conditions */}
        {config.includeContext !== false && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Conditions ({activeFindings.length})
            </h3>
            {activeFindings.length > 0 ? (
              <div className="space-y-3">
                {activeFindings.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0"></div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{f.condition}</div>
                      {f.first_noted_date && <div className="text-xs text-gray-500">Since {format(new Date(f.first_noted_date), 'dd MMM yyyy')}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No active conditions identified.</p>
            )}
          </div>
        )}

        {/* Medications */}
        {config.includeContext !== false && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-500" /> Current Medications ({activeMedications.length})
            </h3>
            {activeMedications.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Medication</th>
                      <th className="px-4 py-3 font-medium">Dosage</th>
                      <th className="px-4 py-3 font-medium">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeMedications.map((m: any) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.dosage || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{m.frequency || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No active medications identified.</p>
            )}
          </div>
        )}

        {/* Recent Investigations */}
        {config.includeContext !== false && investigations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Recent Investigations ({investigations.length})
            </h3>
            <div className="space-y-3">
              {investigations.slice(0, 10).map((inv: any) => (
                <div key={inv.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{inv.test_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Result: <span className="font-bold text-slate-800">{inv.value || 'N/A'}</span>
                      {inv.unit && ` ${inv.unit}`}
                      {inv.reference_range && <span className="text-gray-400"> (Ref: {inv.reference_range})</span>}
                    </div>
                  </div>
                  {inv.date && (
                    <span className="text-xs text-gray-500 font-medium shrink-0">{format(new Date(inv.date), 'dd MMM yyyy')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {config.includeTimeline !== false && events.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Medical Timeline ({events.length} events)
            </h3>
            <div className="space-y-4">
              {events.map((event: any) => (
                <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    {event.event_type === 'CONSULTATION' ? <Stethoscope className="w-5 h-5" /> : 
                     event.event_type === 'LAB_TEST' ? <Activity className="w-5 h-5" /> :
                     <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                      {event.date && <span className="text-xs text-gray-500 font-medium">{format(new Date(event.date), 'dd MMM yyyy')}</span>}
                    </div>
                    <p className="text-xs text-gray-600">{event.description}</p>
                    {event.documentUrl && (
                      <a
                        href={event.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2"
                      >
                        <FileText className="w-3 h-3" /> View Original Document <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Original Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" /> Original Documents ({documents.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{doc.file_name}</div>
                    <div className="text-xs text-gray-500">{doc.document_type || 'Medical Document'}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>This report was securely shared by the patient using DocLens.</p>
          <p className="mt-1">Access expires on {format(new Date(expiresAt), 'dd MMM yyyy, hh:mm a')}</p>
        </div>

      </div>
    </div>
  );
}
