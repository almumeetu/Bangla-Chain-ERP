'use client';

import React from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import type { LoginDict, LoginLang } from './dict';

interface ForgotPasswordModalProps {
  t:            LoginDict;
  language:     LoginLang;
  forgotEmail:  string;
  forgotSent:   boolean;
  forgotLoading:boolean;
  onEmailChange:(v: string) => void;
  onSendReset:  () => void;
  onClose:      () => void;
}

function handleInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (v: string) => void,
) {
  onChange(e.target.value);
}

function handleKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  onSend: () => void,
) {
  if (e.key === 'Enter') onSend();
}

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

export default function ForgotPasswordModal({
  t, language, forgotEmail, forgotSent, forgotLoading,
  onEmailChange, onSendReset, onClose,
}: ForgotPasswordModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.forgotTitle}</h3>
            <p className="text-[10px] font-semibold text-slate-400">{t.forgotSubtitle}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {forgotSent
            ? (
              <div className="text-center py-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900 mb-1">
                  {language === 'bn' ? 'ইমেইল পাঠানো হয়েছে!' : 'Email sent!'}
                </p>
                <p className="text-xs text-slate-500 font-semibold mb-5">{t.resetEmailSent}</p>
                <button
                  onClick={onClose}
                  className="w-full h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  {t.backToLogin}
                </button>
              </div>
            )
            : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t.resetEmailLabel}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => handleInputChange(e, onEmailChange)}
                    onKeyDown={e => handleKeyDown(e, onSendReset)}
                    placeholder="admin@example.com"
                    autoFocus
                    className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={onSendReset}
                    disabled={forgotLoading}
                    className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-400"
                  >
                    {forgotLoading
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.sending}</>
                      : t.sendReset}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
