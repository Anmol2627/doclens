'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/dashboard-layout";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('medical_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create DB Record
      const { data: docData, error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: 'UPLOADED'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Trigger document processing
      fetch('/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docData.id })
      });

      toast.success('Document uploaded successfully! AI is analyzing it now.');
      router.push('/context');
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Upload Records</h2>
          <p className="text-gray-500 mt-1">Upload your medical reports, prescriptions, or imaging results. Our AI will automatically organize them into your context.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12">
          
          <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl p-10 text-center relative hover:bg-emerald-50 transition-colors">
            <input 
              type="file" 
              accept=".pdf,image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
              <UploadIcon className="w-8 h-8 text-emerald-500" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">Click to upload or drag and drop</h3>
            <p className="text-sm text-gray-500 font-medium">PDF, JPG, PNG (max. 10MB)</p>
          </div>

          {file && (
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Selected File:</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="text-gray-400 hover:text-red-500"
                  disabled={isUploading}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5" />
                      Upload & Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">What happens next?</h4>
              <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                Our secure AI will analyze the uploaded document, extract medical entities (conditions, medications, lab values), and organize them into your context timeline. You can always view the original document to verify the extracted insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
