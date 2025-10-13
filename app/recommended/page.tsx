import { prisma } from '../../lib/prisma';
import { MixCard } from '../../components/MixCard';

export const dynamic = 'force-dynamic';

export default async function RecommendedPage() {
	const mixes = await prisma.mix.findMany({
		where: { recommended: { isNot: null } },
		include: { recommended: true },
		orderBy: [
			{ recommended: { priority: 'desc' } },
			{ releaseDate: 'desc' }
		],
		take: 24
	});
	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">Recommended</h1>
				<p className="text-sm text-neutral-500">Curated selections. Highest priority first.</p>
			</header>
			<div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
				{mixes.map(m => (
					<MixCard key={m.id} mix={{ ...m, recommended: true }} />
				))}
				{mixes.length === 0 && (
					<div className="text-sm text-neutral-500">No recommendations yet.</div>
				)}
			</div>
		</div>
	);
}

