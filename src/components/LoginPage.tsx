'use client';

import React from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

import { useLoginPage }        from './login/useLoginPage';
import LoginLeftPanel          from './login/LoginLeftPanel';
import LoginAdminForm          from './login/LoginAdminForm';
import LoginSRForm             from './login/LoginSRForm';
import LoginRegisterForm       from './login/LoginRegisterForm';
import ForgotPasswordModal     from './login/ForgotPasswordModal';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'sr') => void;
}

// ── Named handlers for root-level interactions ─────────────────────────────

function handleRootClick(
  langOpen: boolean,
  closeLang: () => void,
  e: React.MouseEvent,
) {
  if (langOpen) closeLang();
}

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const hook = useLoginPage(onLogin);
  const { t, language } = hook;

  function onRootClick(e: React.MouseEvent) {
    handleRootClick(hook.langOpen, hook.handleCloseLang, e);
  }

  function onSelectEnglish() { hook.handleSelectLang('en'); }
  function onSelectBangla()  { hook.handleSelectLang('bn'); }

  function onSelectAdminTab() { hook.handleSelectAdminTab(); }
  function onSelectSRTab()    { hook.handleSelectSRTab(); }

  function onToggleRegister() { hook.handleToggleRegister(); }

  return (
    <div
      className="min-h-screen bg-[#fafafa] flex font-sans"
      onClick={onRootClick}
    >
      {/* ── Left panel (desktop) ── */}
      <LoginLeftPanel language={language} t={t} />

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 relative">

        {/* Language switcher */}
        <div className="flex justify-end pr-2" onClick={stopPropagation}>
          <div className="relative">
            <button
              type="button"
              onClick={hook.handleToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {language === 'bn' ? 'বাংলা' : 'English'}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${hook.langOpen ? 'rotate-180' : ''}`} />
            </button>
            {hook.langOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={onSelectEnglish}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  English {language === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onSelectBangla}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-sm">

            {/* Mobile brand */}
            <div className="lg:hidden mb-8 text-center select-none">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-slate-900 font-semibold text-lg tracking-tight">DillerPro</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                FMCG Distribution Management
              </p>
            </div>

            {/* Heading */}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {hook.isRegistering ? t.registerTitle : t.welcome}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {hook.isRegistering ? t.registerSubtitle : t.subtitle}
              </p>
            </div>

            {/* Error banner */}
            {hook.error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold text-red-600">{hook.error}</p>
              </div>
            )}

            {/* Admin / SR tab switcher — only when not registering */}
            {!hook.isRegistering && (
              <div className="flex mb-5 bg-slate-100 rounded-lg p-1 gap-1">
                <button
                  type="button"
                  onClick={onSelectAdminTab}
                  className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-all cursor-pointer ${hook.loginTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.tabAdmin}
                </button>
                <button
                  type="button"
                  onClick={onSelectSRTab}
                  className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-all cursor-pointer ${hook.loginTab === 'sr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.tabSR}
                </button>
              </div>
            )}

            {/* Admin Login */}
            {!hook.isRegistering && hook.loginTab === 'admin' && (
              <LoginAdminForm
                t={t}
                language={language}
                email={hook.email}
                password={hook.password}
                showPassword={hook.showPassword}
                isLoading={hook.isLoading}
                onEmailChange={hook.handleEmailChange}
                onPasswordChange={hook.handlePasswordChange}
                onTogglePassword={hook.handleTogglePassword}
                onSubmit={hook.handleAdminLogin}
                onOpenForgot={hook.handleOpenForgot}
              />
            )}

            {/* SR Login */}
            {!hook.isRegistering && hook.loginTab === 'sr' && (
              <LoginSRForm
                t={t}
                language={language}
                srUsername={hook.srUsername}
                srPassword={hook.srPassword}
                showSrPass={hook.showSrPass}
                isLoading={hook.isLoading}
                onUsernameChange={hook.handleSrUsernameChange}
                onPasswordChange={hook.handleSrPasswordChange}
                onToggleSrPass={hook.handleToggleSrPass}
                onSubmit={hook.handleSRLogin}
              />
            )}

            {/* Register */}
            {hook.isRegistering && (
              <LoginRegisterForm
                t={t}
                regEmail={hook.regEmail}
                regPassword={hook.regPassword}
                regConfirm={hook.regConfirm}
                showRegPass={hook.showRegPass}
                showRegConfirm={hook.showRegConfirm}
                isLoading={hook.isLoading}
                onEmailChange={hook.handleRegEmailChange}
                onPasswordChange={hook.handleRegPasswordChange}
                onConfirmChange={hook.handleRegConfirmChange}
                onToggleRegPass={hook.handleToggleRegPass}
                onToggleRegConfirm={hook.handleToggleRegConfirm}
                onSubmit={hook.handleRegister}
              />
            )}

            {/* Toggle register / login (admin tab only) */}
            {hook.loginTab === 'admin' && (
              <div className="mt-5 text-center">
                <button
                  onClick={onToggleRegister}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {hook.isRegistering ? t.toggleToLogin : t.toggleToRegister}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page footer */}
        <p className="text-center text-[10px] text-slate-400 font-bold select-none">
          &copy; 2026 DillerPro &bull; {t.rights} &bull;{' '}
          <a
            href="https://almumeetusaikat.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2"
          >
            Al Mumeetu Saikat
          </a>
        </p>
      </div>

      {/* Forgot password modal */}
      {hook.showForgot && (
        <ForgotPasswordModal
          t={t}
          language={language}
          forgotEmail={hook.forgotEmail}
          forgotStep={hook.forgotStep}
          forgotNewPass={hook.forgotNewPass}
          forgotConfirmPass={hook.forgotConfirmPass}
          forgotSent={hook.forgotSent}
          forgotLoading={hook.forgotLoading}
          onEmailChange={hook.handleForgotEmailChange}
          onNewPassChange={hook.handleForgotNewPassChange}
          onConfirmPassChange={hook.handleForgotConfirmChange}
          onStep1={hook.handleForgotStep1}
          onStep2={hook.handleForgotStep2}
          onClose={hook.handleCloseForgot}
        />
      )}
    </div>
  );
}
