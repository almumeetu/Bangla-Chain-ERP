// Shared prop types for login sub-components.

import type { Language } from '../../translations';
import type { LoginDict } from './dict';

export type { Language };
export type { LoginDict };

export interface LoginPageProps {
  onLogin: (role: 'admin' | 'sr') => void;
}

export interface WithTranslations {
  t: LoginDict;
  language: Language;
}

/** Shared form state threaded down to each form component */
export interface FormSharedProps extends WithTranslations {
  isLoading: boolean;
  error: string;
  onClearError: () => void;
}
