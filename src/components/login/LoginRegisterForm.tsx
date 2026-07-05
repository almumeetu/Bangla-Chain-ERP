'use client';

import React from 'react';
import LoginInputField   from './LoginInputField';
import LoginSubmitButton from './LoginSubmitButton';
import type { LoginDict } from './dict';

interface LoginRegisterFormProps {
  t:                    LoginDict;
  regEmail:             string;
  regPassword:          string;
  regConfirm:           string;
  showRegPass:          boolean;
  showRegConfirm:       boolean;
  isLoading:            boolean;
  onEmailChange:        (v: string) => void;
  onPasswordChange:     (v: string) => void;
  onConfirmChange:      (v: string) => void;
  onToggleRegPass:      () => void;
  onToggleRegConfirm:   () => void;
  onSubmit:             (e: React.FormEvent) => void;
}

export default function LoginRegisterForm({
  t, regEmail, regPassword, regConfirm, showRegPass, showRegConfirm, isLoading,
  onEmailChange, onPasswordChange, onConfirmChange,
  onToggleRegPass, onToggleRegConfirm, onSubmit,
}: LoginRegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LoginInputField
        label={t.email}
        type="email"
        value={regEmail}
        placeholder="admin@example.com"
        autoComplete="email"
        autoFocus
        onChange={onEmailChange}
      />
      <LoginInputField
        label={t.password}
        type="password"
        value={regPassword}
        placeholder="••••••••"
        autoComplete="new-password"
        onChange={onPasswordChange}
        showToggle
        isVisible={showRegPass}
        onToggle={onToggleRegPass}
      />
      <LoginInputField
        label={t.confirmPassword}
        type="password"
        value={regConfirm}
        placeholder="••••••••"
        autoComplete="new-password"
        onChange={onConfirmChange}
        showToggle
        isVisible={showRegConfirm}
        onToggle={onToggleRegConfirm}
      />
      <LoginSubmitButton
        isLoading={isLoading}
        loadingLabel={t.signingUp}
        label={t.signUp}
      />
    </form>
  );
}
