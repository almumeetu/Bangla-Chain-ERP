import type { Metadata } from 'next';
import '../index.css';
import { ToastProvider } from '../components/ui/Toast';

export const metadata: Metadata = {
  title: 'Samir Enterprise — Distribution Management System',
  description: 'সামির এন্টারপ্রাইজ ডিস্ট্রিবিউশন ম্যানেজমেন্ট সিস্টেম — পাইকারি বিক্রয়, স্টক নিয়ন্ত্রণ, ডেলিভারি চালান, সংগ্রহ ইনভয়েস এবং মুনাফা বিশ্লেষণ',
  keywords: ['ERP', 'DMS', 'Distribution', 'Samir Enterprise', 'Bangladesh', 'Wholesale', 'Dealer'],
  authors: [{ name: 'Samir Enterprise' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
        {/* Google Fonts preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
