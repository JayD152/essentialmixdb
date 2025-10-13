import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminMixesListPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');
  if (!session.user?.isAdmin) redirect('/auth');

  const q = searchParams.q?.trim();
  const where: any = q ? {
    OR: [
      { artist: { contains: q, mode: 'insensitive' } },
      ...(isNaN(Number(q)) ? [] : [{ number: Number(q) }])
    ]
  } : {};

  const mixes = await prisma.mix.findMany({ where, orderBy: { number: 'desc' }, take: 200 });

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Mixes</h1>
          <p className="text-sm text-neutral-500">Up to 200 most recent (search to narrow). Edit or remove entries.</p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search artist or number..."
            className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <button className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition">Search</button>
          <Link href="/admin" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition">Dashboard</Link>
          <Link href="/admin/mixes" className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30 transition">Reset</Link>
        </form>
      </header>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-neutral-400 bg-white/5">
            <tr>
              <Th>#</Th>
              <Th>Artist</Th>
              <Th>Date</Th>
              <Th>Genre</Th>
              <Th>BPM</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {mixes.map(m => (
              <tr key={m.id} className="hover:bg-white/5 transition">
                <Td className="font-mono text-xs text-neutral-400">#{m.number}</Td>
                <Td className="font-medium text-neutral-100 max-w-[180px] truncate">{m.artist}</Td>
                <Td className="text-neutral-400">{new Date(m.releaseDate).toISOString().slice(0,10)}</Td>
                <Td className="text-neutral-400">{m.genre || '—'}</Td>
                <Td className="text-neutral-400">{m.bpmLow ? `${m.bpmLow}${m.bpmHigh?`-${m.bpmHigh}`:''}` : '—'}</Td>
                <Td className="text-right pr-4">
                  <Link href={`/admin/mixes/${m.id}`} className="text-[11px] px-3 py-1 rounded-full border border-white/15 hover:border-white/40 transition">Edit</Link>
                </Td>
              </tr>
            ))}
            {mixes.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center py-10 text-neutral-500">No mixes found.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium py-2 px-3 first:pl-4">{children}</th>;
}
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`py-2 px-3 first:pl-4 ${className}`}>{children}</td>;
}
