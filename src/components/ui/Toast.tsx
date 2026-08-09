'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = opts.duration ?? (opts.type === 'error' ? 5000 : 3500);
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5 at once
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastRenderer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Renderer ──────────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bar: string; icon: string; iconBg: string; title: string }> = {
  success: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50',  icon: 'text-emerald-600', title: 'text-emerald-900' },
  error:   { bar: 'bg-rose-500',    iconBg: 'bg-rose-50',     icon: 'text-rose-600',    title: 'text-rose-900'    },
  warning: { bar: 'bg-amber-400',   iconBg: 'bg-amber-50',    icon: 'text-amber-600',   title: 'text-amber-900'   },
  info:    { bar: 'bg-blue-500',    iconBg: 'bg-blue-50',     icon: 'text-blue-600',    title: 'text-blue-900'    },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle  className="w-4.5 h-4.5" />,
  error:   <XCircle      className="w-4.5 h-4.5" />,
  warning: <AlertTriangle className="w-4.5 h-4.5" />,
  info:    <Info         className="w-4.5 h-4.5" />,
};

function ToastRenderer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" aria-live="polite">
      {toasts.map(t => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto w-80 bg-white rounded-none border border-slate-200 shadow-xl overflow-hidden flex animate-slide-in-right"
            role="alert"
          >
            {/* Left color bar */}
            <div className={`w-1 shrink-0 ${s.bar}`} />

            {/* Icon */}
            <div className={`flex items-start pt-3.5 pl-3 pr-1 ${s.iconBg}`}>
              <span className={s.icon}>{ICONS[t.type]}</span>
            </div>

            {/* Content */}
            <div className={`flex-1 px-3 py-3 ${s.iconBg}`}>
              <p className={`text-xs font-bold leading-tight ${s.title}`}>{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>

            {/* Dismiss */}
            <div className={`flex items-start pt-2.5 pr-2.5 ${s.iconBg}`}>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="p-1 rounded-none text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
