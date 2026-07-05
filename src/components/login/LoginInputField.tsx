'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const BASE_INPUT =
  'w-full h-11 px-4 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 border-slate-200 hover:border-slate-300';

interface LoginInputFieldProps {
  id?:          string;
  label:        string;
  type:         'text' | 'email' | 'password';
  value:        string;
  placeholder:  string;
  autoComplete: string;
  autoFocus?:   boolean;
  onChange:     (v: string) => void;
  /** Only for password type */
  showToggle?:  boolean;
  isVisible?:   boolean;
  onToggle?:    () => void;
  /** Optional right side element (e.g. Forgot link) */
  labelRight?:  React.ReactNode;
}

function handleChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (v: string) => void,
) {
  onChange(e.target.value);
}

export default function LoginInputField({
  id, label, type, value, placeholder, autoComplete, autoFocus,
  onChange, showToggle, isVisible, onToggle, labelRight,
}: LoginInputFieldProps) {
  const inputType = (type === 'password' && isVisible) ? 'text' : type;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => handleChange(e, onChange)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={showToggle ? `${BASE_INPUT} pr-11` : BASE_INPUT}
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
