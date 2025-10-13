import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import AdminUsersClient from '../../../components/AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');
  if (!session.user?.isAdmin) redirect('/auth');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 400 });
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-neutral-500">Manage accounts, elevate admins, and ban abusive users.</p>
      </header>
      <AdminUsersClient initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
