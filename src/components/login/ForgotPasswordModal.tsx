'use client';

import React from 'react';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import type { LoginDict, LoginLang } from './dict';

interface ForgotPasswordModalProps {
  t:                   LoginDict;
  language:            LoginLang;
  forgotEmail:         string;
  forgotStep:          1 | 2 | 3;
  forgotNewPass:       string;
  forgotConfirmPass:   string;
  forgotSent:          boolean;
  forgotLoading:       boolean;
  onEmailChange:       (v: string) => void;
  onNewPassChange:     (v: string) => void;
  onConfirmPassChange: (v: string) => void;
  onStep1:             () => void;
  onStep2:             (e: React.FormEvent) => void;
  onClose:             () => void;
}

function handleEmailInput(e: React.ChangeEvent<HTMLInputElement>, cb: (v: string) => void) {
  cb(e.target.value);
}

function handlePassInput(e: React.ChangeEvent<HTMLInputElement>, cb: (v: string) => void) {
  cb(e.target.value);
}

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

export default function ForgotPasswordModal({
  t, language,
  forgotEmail, forgotStep, forgotNewPass, forgotConfirmPass,
  forgotSent, forgotLoading,
  onEmailChange, onNewPassChange, onConfirmPassChange,
  onStep1, onStep2, onClose,
}: ForgotPasswordModalProps) {
  const bn = language === 'bn';

  const inputCls = 'w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400';

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
            <h3 className="text-sm font-bold text-slate-900">
              {bn ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {bn ? `ধাপ ${forgotStep} / ৩` : `Step ${forgotStep} of 3`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {([1, 2, 3] as const).map(s => (
              <div key={s} className={`w-2 h-2 rounded-full transition-all ${forgotStep >= s ? 'bg-slate-900' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Step 3 / Success */}
          {forgotSent ? (
            <div className="text-center py-3">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-900 mb-1">
                {bn ? 'পাসওয়ার্ড আপডেট হয়েছে!' : 'Password Updated!'}
              </p>
              <p className="text-xs text-slate-500 font-semibold mb-5">
                {bn ? 'নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' : 'You can now sign in with your new password.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all"
              >
                {bn ? 'লগইন পেজে যান' : 'Back to Sign In'}
              </button>
            </div>
          ) : forgotStep === 1 ? (
            /* Step 1 — enter email */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {bn ? 'ইমেইল / ইউজারনেম' : 'Email / Username'}
                </label>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={e => handleEmailInput(e, onEmailChange)}
                  onKeyDown={e => e.key === 'Enter' && onStep1()}
                  placeholder={bn ? 'আপনার ইমেইল লিখুন' : 'Enter your email'}
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="button" onClick={onStep1}
                  className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                  {bn ? 'পরবর্তী' : 'Next'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 2 — set new password */
            <form onSubmit={onStep2} className="space-y-4">
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                {forgotEmail}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={forgotNewPass}
                  onChange={e => handlePassInput(e, onNewPassChange)}
                  placeholder="••••••••"
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={forgotConfirmPass}
                  onChange={e => handlePassInput(e, onConfirmPassChange)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" disabled={forgotLoading}
                  className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all disabled:bg-slate-400 flex items-center justify-center gap-1.5">
                  {forgotLoading
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : null}
                  {bn ? 'পাসওয়ার্ড সেট করুন' : 'Set Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
