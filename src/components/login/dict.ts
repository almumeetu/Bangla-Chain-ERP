export type LoginLang = 'en' | 'bn';

export const loginDict = {
  en: {
    welcome:           'Welcome back',
    subtitle:          'Sign in to access your distribution console.',
    registerTitle:     'Create Admin Account',
    registerSubtitle:  'Register a new B2B distributor admin console.',
    email:             'Email',
    password:          'Password',
    confirmPassword:   'Confirm Password',
    srUsername:        'SR Username',
    forgot:            'Forgot password?',
    signIn:            'Sign In',
    signingIn:         'Signing in...',
    signUp:            'Create Account',
    signingUp:         'Creating...',
    toggleToRegister:  "Don't have an admin account? Create one",
    toggleToLogin:     'Already registered? Sign in instead',
    tabAdmin:          'Admin',
    tabSR:             'SR Login',
    errorRequired:     'Please fill in all fields.',
    errorInvalid:      'Invalid credentials. Please try again.',
    errorPasswordMatch:'Passwords do not match.',
    errorMinPassword:  'Password must be at least 6 characters.',
    rights:            'All Rights Reserved',
    security:          'Enterprise-grade security • Data encrypted in cloud',
    resetEmailSent:    'Password reset email sent! Check your inbox.',
    resetEmailLabel:   'Enter your admin email',
    sendReset:         'Send Reset Link',
    sending:           'Sending...',
    backToLogin:       'Back to Sign In',
    forgotTitle:       'Reset Password',
    forgotSubtitle:    "We'll send a reset link to your email.",
    madeBy:            'Made by',
    cloudBadge:        'Cloud-powered • Any device',
    features: [
      { icon: '☁️', label: 'Cloud Sync',                          sub: 'Access data from any device'   },
      { icon: '📦', label: 'Stock & Warehouse Control',            sub: 'Real-time inventory tracking'  },
      { icon: '🧾', label: 'Delivery Challan & SR Management',     sub: 'Printable challan sheets'      },
      { icon: '💰', label: 'Profit & Expense Accounting',          sub: 'Auto profit-loss calculator'   },
    ],
  },
  bn: {
    welcome:           'স্বাগতম',
    subtitle:          'আপনার ডিস্ট্রিবিউশন কনসোলে প্রবেশ করতে সাইন-ইন করুন।',
    registerTitle:     'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    registerSubtitle:  'নতুন ডিস্ট্রিবিউটর অ্যাডমিন ড্যাশবোর্ড রেজিস্টার করুন।',
    email:             'ইমেইল',
    password:          'পাসওয়ার্ড',
    confirmPassword:   'পাসওয়ার্ড নিশ্চিত করুন',
    srUsername:        'SR ইউজারনেম',
    forgot:            'পাসওয়ার্ড ভুলে গেছেন?',
    signIn:            'সাইন ইন করুন',
    signingIn:         'সাইন ইন হচ্ছে...',
    signUp:            'অ্যাকাউন্ট তৈরি করুন',
    signingUp:         'তৈরি হচ্ছে...',
    toggleToRegister:  'অ্যাকাউন্ট নেই? নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    toggleToLogin:     'ইতিমধ্যে রেজিস্টার করেছেন? সাইন ইন করুন',
    tabAdmin:          'অ্যাডমিন',
    tabSR:             'SR লগইন',
    errorRequired:     'অনুগ্রহ করে সব তথ্য পূরণ করুন।',
    errorInvalid:      'ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
    errorPasswordMatch:'পাসওয়ার্ড দুটি মিলছে না।',
    errorMinPassword:  'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।',
    rights:            'সর্বস্বত্ব সংরক্ষিত',
    security:          'এন্টারপ্রাইজ-গ্রেড সিকিউরিটি • ডেটা ক্লাউডে সুরক্ষিত',
    resetEmailSent:    'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।',
    resetEmailLabel:   'আপনার অ্যাডমিন ইমেইল লিখুন',
    sendReset:         'রিসেট লিংক পাঠান',
    sending:           'পাঠানো হচ্ছে...',
    backToLogin:       'লগইন পেজে ফিরে যান',
    forgotTitle:       'পাসওয়ার্ড রিসেট',
    forgotSubtitle:    'আপনার ইমেইলে একটি রিসেট লিংক পাঠানো হবে।',
    madeBy:            'তৈরি করেছেন',
    cloudBadge:        'ক্লাউড-পাওয়ার্ড • যেকোনো ডিভাইসে',
    features: [
      { icon: '☁️', label: 'ক্লাউড সিঙ্ক',                      sub: 'যেকোনো ডিভাইস থেকে ডেটা পাবেন'  },
      { icon: '📦', label: 'স্টক ও গুদাম নিয়ন্ত্রণ',             sub: 'রিয়েল-টাইম ইনভেন্টরি ট্র্যাকিং'  },
      { icon: '🧾', label: 'ডেলিভারি চালান ও SR ম্যানেজমেন্ট', sub: 'প্রিন্টযোগ্য চালান শিট'           },
      { icon: '💰', label: 'মুনাফা ও খরচ হিসাব',                  sub: 'অটো লাভ-ক্ষতি ক্যালকুলেটর'     },
    ],
  },
} as const;

export type LoginDict = {
  welcome:           string;
  subtitle:          string;
  registerTitle:     string;
  registerSubtitle:  string;
  email:             string;
  password:          string;
  confirmPassword:   string;
  srUsername:        string;
  forgot:            string;
  signIn:            string;
  signingIn:         string;
  signUp:            string;
  signingUp:         string;
  toggleToRegister:  string;
  toggleToLogin:     string;
  tabAdmin:          string;
  tabSR:             string;
  errorRequired:     string;
  errorInvalid:      string;
  errorPasswordMatch:string;
  errorMinPassword:  string;
  rights:            string;
  security:          string;
  resetEmailSent:    string;
  resetEmailLabel:   string;
  sendReset:         string;
  sending:           string;
  backToLogin:       string;
  forgotTitle:       string;
  forgotSubtitle:    string;
  madeBy:            string;
  cloudBadge:        string;
  features:          ReadonlyArray<{ icon: string; label: string; sub: string }>;
};
