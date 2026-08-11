import { redirect } from 'next/navigation';

/**
 * /login route — redirect to the main app.
 * LoginPage is rendered inside /admin/dashboard when unauthenticated.
 */
export default function LoginPage() {
  redirect('/admin/dashboard');
}
