import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import Link from 'next/link';
import { AdminEditMixForm } from '../../../../components/AdminEditMixForm';

export default async function EditMixPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');
  if (!session.user?.isAdmin) redirect('/auth');

  const id = Number(params.id);
  if (!Number.isInteger(id)) return notFound();
  const mix = await prisma.mix.findUnique({ where: { id } });
  if (!mix) return notFound();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-4 justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Mix #{mix.number}</h1>
          <p className="text-sm text-neutral-500">ID {mix.id} • {new Date(mix.releaseDate).toISOString().slice(0,10)} • {mix.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/mixes" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition">Back</Link>
          <Link href={`/mix/${mix.number}`} className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition">View Public</Link>
        </div>
      </header>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
        <AdminEditMixForm mix={mix} />
      </div>
    </div>
  );
}
