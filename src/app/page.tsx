import { redirect } from 'next/navigation';

/**
 * Root route — always redirect to the dashboard page.
 * LoginPage is rendered inside dashboard/page.tsx when unauthenticated.
 */
export default function RootPage() {
  redirect('/admin/dashboard');
}
