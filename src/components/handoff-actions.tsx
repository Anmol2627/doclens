'use client';

import { Printer, Copy, CheckCircle2 } from "lucide-react";
import { useState, useRef } from 'react';

export function HandoffActions() {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex items-center gap-3 print:hidden">
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
