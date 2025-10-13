import { MixCard } from './MixCard';
import { prisma } from '../lib/prisma';

export async function LatestSection() {
  const mixes = await prisma.mix.findMany({
    orderBy: { releaseDate: 'desc' },
    take: 6
  });
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Latest</h2>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mixes.map(m => <MixCard key={m.id} mix={m} />)}
      </div>
    </section>
  );
}
