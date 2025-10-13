import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { AdminNewMixForm } from '../../components/AdminNewMixForm';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');
  if (!session.user?.isAdmin) redirect('/auth');

  const latest = await prisma.mix.findMany({ orderBy: { createdAt: 'desc' }, take: 8 });

  return (
    <div className="space-y-12">
      <header className="space-y-2 relative">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent-pink to-pink-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-neutral-500">Create new mixes and manage recent entries.</p>
      </header>
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">New Mix</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
          <AdminNewMixForm />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Management</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/mixes" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition bg-white/5">Manage Mixes</Link>
          <Link href="/admin/reviews" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition bg-white/5">Reviews</Link>
          <Link href="/admin/users" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition bg-white/5">Users</Link>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Mixes</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {latest.map(m => (
            <Link key={m.id} href={`/mix/${m.number}`} className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>#{m.number}</span>
                <span>{new Date(m.releaseDate).getFullYear()}</span>
              </div>
              <p className="text-sm font-medium text-neutral-100 line-clamp-1">{m.artist}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
