'use client';

import React from 'react';
import LoginInputField   from './LoginInputField';
import LoginSubmitButton from './LoginSubmitButton';
import type { LoginDict, LoginLang } from './dict';

interface LoginAdminFormProps {
  t:                    LoginDict;
  language:             LoginLang;
  email:                string;
  password:             string;
  showPassword:         boolean;
  isLoading:            boolean;
  onEmailChange:        (v: string) => void;
  onPasswordChange:     (v: string) => void;
  onTogglePassword:     () => void;
  onSubmit:             (e: React.FormEvent) => void;
  onOpenForgot:         () => void;
}

function buildForgotLink(label: string, onClick: () => void) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}

export default function LoginAdminForm({
  t, language, email, password, showPassword, isLoading,
  onEmailChange, onPasswordChange, onTogglePassword, onSubmit, onOpenForgot,
}: LoginAdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LoginInputField
        id="login-email"
        label={t.email}
        type="email"
        value={email}
        placeholder="admin@example.com"
        autoComplete="email"
        autoFocus
        onChange={onEmailChange}
      />
      <LoginInputField
        id="login-password"
        label={t.password}
        type="password"
        value={password}
        placeholder="••••••••"
        autoComplete="current-password"
        onChange={onPasswordChange}
        showToggle
        isVisible={showPassword}
        onToggle={onTogglePassword}
        labelRight={buildForgotLink(t.forgot, onOpenForgot)}
      />
      <LoginSubmitButton
        isLoading={isLoading}
        loadingLabel={t.signingIn}
        label={t.signIn}
      />
    </form>
  );
}
