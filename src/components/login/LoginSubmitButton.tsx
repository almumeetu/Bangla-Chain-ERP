'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LoginSubmitButtonProps {
  isLoading:   boolean;
  loadingLabel:string;
  label:       string;
}

export default function LoginSubmitButton({ isLoading, loadingLabel, label }: LoginSubmitButtonProps) {
  const cls = isLoading
    ? 'bg-slate-400 text-white cursor-wait'
    : 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm active:scale-[0.98]';

  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`w-full h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${cls}`}
    >
      {isLoading
        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{loadingLabel}</>
        : <>{label}<ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}
