import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import EnhancedHelpPage from './EnhancedHelpPage';

export default async function HelpPage() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  return <EnhancedHelpPage />;
}
