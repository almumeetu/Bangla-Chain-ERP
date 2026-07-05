'use client';

import React from 'react';
import LoginInputField   from './LoginInputField';
import LoginSubmitButton from './LoginSubmitButton';
import type { LoginDict, LoginLang } from './dict';

interface LoginSRFormProps {
  t:                  LoginDict;
  language:           LoginLang;
  srUsername:         string;
  srPassword:         string;
  showSrPass:         boolean;
  isLoading:          boolean;
  onUsernameChange:   (v: string) => void;
  onPasswordChange:   (v: string) => void;
  onToggleSrPass:     () => void;
  onSubmit:           (e: React.FormEvent) => void;
}

export default function LoginSRForm({
  t, language, srUsername, srPassword, showSrPass, isLoading,
  onUsernameChange, onPasswordChange, onToggleSrPass, onSubmit,
}: LoginSRFormProps) {
  const srPlaceholder = language === 'bn' ? 'যেমন: rakib' : 'e.g. rakib';
  const helpText      = language === 'bn'
    ? 'SR পাসওয়ার্ড ভুললে Admin-কে জানান।'
    : 'Forgot SR password? Contact your Admin.';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LoginInputField
        label={t.srUsername}
        type="text"
        value={srUsername}
        placeholder={srPlaceholder}
        autoComplete="username"
        autoFocus
        onChange={onUsernameChange}
      />
      <LoginInputField
        label={t.password}
        type="password"
        value={srPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        onChange={onPasswordChange}
        showToggle
        isVisible={showSrPass}
        onToggle={onToggleSrPass}
      />
      <LoginSubmitButton
        isLoading={isLoading}
        loadingLabel={t.signingIn}
        label={t.signIn}
      />
      <p className="text-center text-[10px] text-slate-400 font-medium">{helpText}</p>
    </form>
  );
}
