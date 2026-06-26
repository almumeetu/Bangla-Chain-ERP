import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'BanglaChain ERP',
  description: 'Enterprise Operations Supply Chain & Inventory OS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
