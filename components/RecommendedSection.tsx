import { prisma } from '../lib/prisma';
import { MixCard } from './MixCard';

export async function RecommendedSection() {
  const mixes = await prisma.mix.findMany({
    where: { recommended: { isNot: null } },
    include: { recommended: true },
    orderBy: [
      { recommended: { priority: 'desc' } },
      { releaseDate: 'desc' }
    ],
    take: 8
  });
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Recommended</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mixes.map(m => <MixCard key={m.id} mix={{ ...m, recommended: true }} />)}
      </div>
    </section>
  );
}
