'use client';

import DashboardLayout from "@/components/dashboard-layout";
import { UserPlus, FileText, Clock, FileStack, Sparkles, AlertTriangle, QrCode, Copy, CheckCircle2, ChevronDown, Loader2, Link2 } from "lucide-react";
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function SharePage() {
  const userRole = 'PATIENT';

  // State for selections
  const [includeContext, setIncludeContext] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeAttention, setIncludeAttention] = useState(true);
  const [expiresIn, setExpiresIn] = useState('7d');

  // State for generated link
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeContext,
          includeTimeline,
          includeDocuments,
          includeAttention,
          expiresIn
        })
      });

      const data = await res.json();
      if (data.success) {
        setShareUrl(data.shareUrl);
        setExpiresAt(data.expiresAt);

        // Generate QR code
        const qr = await QRCode.toDataURL(data.shareUrl, {
          width: 256,
          margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' }
        });
        setQrDataUrl(qr);
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            Share with a Doctor <span className="text-orange-500">🤝</span>
          </h2>
          <p className="text-gray-500 mt-1">Select the context elements you want to share to generate a comprehensive handoff report.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Select Context Elements */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <h3 className="text-xl font-bold text-slate-900">Select Context Elements</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Choose what to include in the handoff report.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <label className={`relative flex flex-col p-4 bg-white border-2 ${includeContext ? 'border-emerald-500' : 'border-gray-200'} rounded-xl cursor-pointer hover:bg-gray-50 transition-colors`}>
                  <input type="checkbox" className="absolute right-4 top-4 w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer" checked={includeContext} onChange={() => setIncludeContext(!includeContext)} />
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">My Health Context</h4>
                  </div>
                  <p className="text-xs text-gray-500">Full AI-organized summary, active conditions, medications, and investigations.</p>
                </label>

                <label className={`relative flex flex-col p-4 bg-white border-2 ${includeTimeline ? 'border-emerald-500' : 'border-gray-200'} rounded-xl cursor-pointer hover:bg-gray-50 transition-colors`}>
                  <input type="checkbox" className="absolute right-4 top-4 w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer" checked={includeTimeline} onChange={() => setIncludeTimeline(!includeTimeline)} />
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Timeline (Last 6 Months)</h4>
                  </div>
                  <p className="text-xs text-gray-500">Chronological history of recent medical events and changes.</p>
                </label>

                <label className={`relative flex flex-col p-4 bg-white border-2 ${includeDocuments ? 'border-emerald-500' : 'border-gray-200'} rounded-xl cursor-pointer hover:bg-gray-50 transition-colors`}>
                  <input type="checkbox" className="absolute right-4 top-4 w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer" checked={includeDocuments} onChange={() => setIncludeDocuments(!includeDocuments)} />
                  <div className="flex items-center gap-2 mb-2">
                    <FileStack className="w-5 h-5 text-blue-500" />
                    <h4 className="font-bold text-slate-900 text-sm">Raw Records (PDFs)</h4>
                  </div>
                  <p className="text-xs text-gray-500">Include access to the original uploaded PDF documents for verification.</p>
                </label>

                <label className={`relative flex flex-col p-4 bg-white border-2 ${includeAttention ? 'border-emerald-500' : 'border-gray-200'} rounded-xl cursor-pointer hover:bg-gray-50 transition-colors`}>
                  <input type="checkbox" className="absolute right-4 top-4 w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer" checked={includeAttention} onChange={() => setIncludeAttention(!includeAttention)} />
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h4 className="font-bold text-slate-900 text-sm">Needs Your Attention</h4>
                  </div>
                  <p className="text-xs text-gray-500">Highlighted context gaps, missing reports, or abnormal trends.</p>
                </label>

              </div>
            </div>

            {/* Step 2: Configure Access */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <h3 className="text-xl font-bold text-slate-900">Configure Access</h3>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Access Expiration</h4>
                  <p className="text-xs text-gray-500">Automatically revoke access after a certain period.</p>
                </div>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-700"
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="6m">6 Months</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
            
          </div>

          {/* Right Sidebar Column - QR & Link */}
          <div className="space-y-6">
            
            <div className="bg-slate-900 rounded-2xl p-1 shadow-lg sticky top-8">
              <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col relative">
                
                <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between z-10">
                  <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {shareUrl ? 'Secure Link Generated!' : 'Clinical Handoff Preview'}
                  </h3>
                </div>

                <div className="p-5 flex-1 relative">
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  <div className="relative z-10 space-y-5">
                    
                    {shareUrl && qrDataUrl ? (
                      <>
                        {/* QR Code */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-white border-2 border-gray-200 p-3 rounded-2xl shadow-sm">
                            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-3 font-medium text-center">Scan this QR code to open the secure clinical portal</p>
                        </div>

                        {/* Share URL */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1.5">Secure Link</p>
                          <p className="text-xs text-slate-700 font-mono break-all leading-relaxed">{shareUrl}</p>
                        </div>

                        {/* Expiry */}
                        {expiresAt && (
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium">
                              Expires: {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        )}

                        {/* Included items */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Included</p>
                          <div className="flex flex-wrap gap-1.5">
                            {includeContext && <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">Health Context</span>}
                            {includeTimeline && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">Timeline</span>}
                            {includeDocuments && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-semibold">Raw PDFs</span>}
                            {includeAttention && <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-[10px] font-semibold">Attention Items</span>}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center py-8">
                          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <QrCode className="w-10 h-10 text-gray-400" strokeWidth={1} />
                          </div>
                          <h4 className="font-bold text-slate-900 mb-1">Ready to Share</h4>
                          <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Configure your sharing preferences and generate a secure link with QR code.</p>
                        </div>
                      </>
                    )}

                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 z-10">
                  {!shareUrl ? (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-5 h-5" /> Generate Secure Link</>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCopy}
                        className="w-full bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Link</>
                        )}
                      </button>
                      <button
                        onClick={() => { setShareUrl(null); setQrDataUrl(null); setExpiresAt(null); }}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
                      >
                        Generate New Link
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
