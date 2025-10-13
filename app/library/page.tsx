import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { MixCard } from '../../components/MixCard';
import Link from 'next/link';

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Your Library</h1>
        <p className="text-neutral-400 text-sm">Sign in to see saved mixes.</p>
        <Link href="/auth" className="inline-block bg-gradient-accent text-white px-4 py-2 rounded text-sm font-medium">Sign In</Link>
      </div>
    );
  }
  const entries = await prisma.libraryEntry.findMany({ where: { userId: session.user.id }, include: { mix: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Your Library</h1>
      {entries.length === 0 && <p className="text-neutral-500 text-sm">No mixes saved yet.</p>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {entries.map(e => <MixCard key={e.id} mix={e.mix} />)}
      </div>
    </div>
  );
}
