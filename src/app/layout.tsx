import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Samir Enterprise — Distribution Management System',
  description: 'সামির এন্টারপ্রাইজ ডিস্ট্রিবিউশন ম্যানেজমেন্ট সিস্টেম — পাইকারি বিক্রয়, স্টক নিয়ন্ত্রণ, ডেলিভারি চালান, সংগ্রহ ইনভয়েস এবং মুনাফা বিশ্লেষণ',
  keywords: ['ERP', 'DMS', 'Distribution', 'Samir Enterprise', 'Bangladesh', 'Wholesale', 'Dealer'],
  authors: [{ name: 'Samir Enterprise' }],
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
        {/* Google Fonts preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
