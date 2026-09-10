'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProfile } from '@/app/actions/profile';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileForm({ initialData, userId }: { initialData: any, userId: string }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setSaveStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const result = await saveProfile(userId, formData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setSaveStatus('success');
      router.refresh(); 
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-8 space-y-8">
        
        {/* Basic Info Section */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-gray-100 pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white"
              >
                <option value="">Select gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </section>

        {/* Medical Vitals Section */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-gray-100 pb-2">Medical Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Blood Group</label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white"
              >
                <option value="">Select type...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                name="height_cm"
                value={formData.height_cm}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                placeholder="70.5"
              />
            </div>
          </div>
        </section>

        {/* Allergies Section */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-gray-100 pb-2">Allergies</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Known Allergies (comma separated)</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              placeholder="e.g., Peanuts, Penicillin, Dust mites"
            />
            <p className="text-xs text-gray-500">Leave blank if you have no known allergies.</p>
          </div>
        </section>

      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 p-6 border-t border-gray-200 flex items-center justify-between">
        <div className="flex-1">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-5 h-5" />
              Profile updated successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
              <AlertCircle className="w-5 h-5" />
              {errorMessage}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </form>
  );
}
