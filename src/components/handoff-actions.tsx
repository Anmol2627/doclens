'use client';

import { Printer, Copy, CheckCircle2, Globe, Loader2 } from "lucide-react";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'zh', label: '台灣 (Taiwanese)' },
];

export function HandoffActions() {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get('lang') || 'en';

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const reportEl = document.getElementById('handoff-report');
    if (reportEl) {
      // Get the text content of the report
      const text = reportEl.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLanguageChange = (lang: string) => {
    if (lang === 'en') {
      router.push('/handoff');
    } else {
      router.push(`/handoff?lang=${lang}`);
    }
  };

  return (
    <div className="flex items-center gap-3 print:hidden">
      {/* Language Selector */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Globe className="w-4 h-4 text-gray-500" />
          <select
            value={currentLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-1 appearance-none"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-white border border-gray-200 text-slate-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
      >
        {copied ? (
          <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Copied!</>
        ) : (
          <><Copy className="w-4 h-4" /> Copy</>
        )}
      </button>
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
      >
        <Printer className="w-4 h-4" /> Print / PDF
      </button>
    </div>
  );
}
