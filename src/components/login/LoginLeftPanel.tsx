import React from 'react';
import { Shield } from 'lucide-react';
import type { LoginLang, LoginDict } from './dict';

interface LoginLeftPanelProps {
  language: LoginLang;
  t:        LoginDict;
}

export default function LoginLeftPanel({ language, t }: LoginLeftPanelProps) {
  const gridStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
    backgroundSize:  '60px 60px',
  };

  return (
    <div className="hidden lg:flex lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 select-none">
      <div className="absolute inset-0 opacity-[0.03]" style={gridStyle} />
      <div className="absolute top-20 right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-16 w-56 h-56 bg-white/[0.03] rounded-full blur-2xl" />

      {/* Brand */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-slate-950 font-bold text-lg">D</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">DillerPro</span>
        </div>
        <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mt-1">
          FMCG Distribution Management
        </p>
      </div>

      {/* Pitch + features */}
      <div className="relative z-10 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {t.cloudBadge}
          </span>
        </div>

        <h1 className="text-white text-[2rem] font-bold leading-tight tracking-tight mb-4">
          {language === 'bn'
            ? <>চালান থেকে মুনাফা পর্যন্ত —<br /><span className="text-slate-400">সব এক জায়গায়।<br />রিয়েল-টাইমে।</span></>
            : <>From challan to profit —<br /><span className="text-slate-400">everything in one place.<br />In real time.</span></>}
        </h1>

        <div className="space-y-2.5">
          {t.features.map(item => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="text-white text-xs font-semibold leading-tight">{item.label}</p>
                <p className="text-slate-500 text-[10px] font-medium mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span>{t.security}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-[10px] font-semibold">{t.madeBy}</span>
          <a
            href="https://almumeetusaikat.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-white/80 hover:text-white transition-colors underline underline-offset-2 decoration-slate-600 hover:decoration-white"
          >
            Al Mumeetu Saikat
          </a>
        </div>
      </div>
    </div>
  );
}
