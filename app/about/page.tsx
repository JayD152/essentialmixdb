import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export const metadata = {
	title: 'About • Essential Mix DB'
};

export default async function AboutPage() {
	// Parallelize small aggregate lookups
	const [mixCount, trackCount, reviewCount, userCount, libraryCount, recommendedCount, firstMix, latestMix] = await Promise.all([
		prisma.mix.count(),
		prisma.track.count(),
		prisma.review.count(),
		prisma.user.count(),
		prisma.libraryEntry.count(),
		prisma.recommendedMix.count(),
		prisma.mix.findFirst({ orderBy: { releaseDate: 'asc' }, select: { releaseDate: true, number: true, artist: true } }),
		prisma.mix.findFirst({ orderBy: { releaseDate: 'desc' }, select: { releaseDate: true, number: true, artist: true } })
	]);

	const firstYear = firstMix?.releaseDate.getFullYear();
	const latestYear = latestMix?.releaseDate.getFullYear();

	return (
		<div className="space-y-14">
			<section className="max-w-3xl space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight">About</h1>
				<p className="text-neutral-300 leading-relaxed">
					Essential Mix DB is a lovingly crafted, independent archive & personal library interface for BBC Radio 1&apos;s
					long-running Essential Mix series. The goal: make every mix instantly explorable — searchable by artist, era,
					mood, and more — while letting you curate a personal collection of favorites.
				</p>
				<p className="text-neutral-400 text-sm">
					This project is not affiliated with or endorsed by the BBC. All audio and artwork remain the property of their
					respective owners. Where possible only metadata is stored here; streaming links defer to official / third–party
					platforms.
				</p>
                <p className="text-neutral-400 text-sm">
                    Made with love by Jay Dip/HCWS. This is one of my favorite weekly radio shows and I'm honored to contribute to it's legacy.
                </p>
			</section>

			<section>
				<h2 className="text-xl font-medium mb-4">At a Glance</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Stat label="Mixes" value={mixCount} />
					<Stat label="Tracks Indexed" value={trackCount} />
					<Stat label="User Libraries Entries" value={libraryCount} />
					<Stat label="Reviews" value={reviewCount} />
					<Stat label="Registered Users" value={userCount} />
					<Stat label="Featured / Recommended" value={recommendedCount} />
				</div>
				<div className="mt-6 text-sm text-neutral-400 space-y-1">
					{firstYear && latestYear && (
						<p>
							Coverage spans <span className="text-neutral-200 font-medium">{firstYear}</span> →{' '}
							<span className="text-neutral-200 font-medium">{latestYear}</span>. ({firstMix?.artist} #{firstMix?.number} → {latestMix?.artist} #{latestMix?.number})
						</p>
					)}
				</div>
			</section>

			<section className="max-w-4xl space-y-4">
				<h2 className="text-xl font-medium mb-2">Technology</h2>
				<ul className="list-disc pl-5 text-neutral-300 text-sm space-y-1">
					<li>Next.js 14 App Router (hybrid Server & Client Components)</li>
					<li>TypeScript + Tailwind CSS for rapid, consistent UI styling</li>
					<li>Prisma ORM (SQLite dev – ready for Postgres / PlanetScale in production)</li>
					<li>NextAuth for authentication & session handling</li>
					<li>Custom animations (hearts, heartbreak, gradient title) for a bit of delight</li>
				</ul>
			</section>

			<section className="max-w-4xl space-y-4">
				<h2 className="text-xl font-medium mb-2">Roadmap (Aspirational)</h2>
				<ul className="list-disc pl-5 text-neutral-300 text-sm space-y-1">
					<li>Global web audio player with seamless mix playback & position memory</li>
					<li>Jump-to-track timecodes & dynamic waveform / progress scrubbing</li>
					<li>Drag & drop tracklist reordering + bulk paste import</li>
					<li>Adaptive contrast & color extraction precomputed server-side</li>
					<li>Advanced search (BPM range, era, location tags)</li>
					<li>Optional user playlists & mix bundles</li>
					<li>Accessibility & performance audit (reducing layout shift, motion-reduced variants)</li>
				</ul>
			</section>

			<section className="max-w-3xl space-y-3 text-sm text-neutral-400">
				<h2 className="text-neutral-200 font-medium text-base">Contributing / Feedback</h2>
				<p>
					Spot incorrect metadata? Have a feature idea? Feel free to open an issue or reach out. This archive improves
					with every correction and contribution.
				</p>
                <p>
                    Special thank you to all the contributors to this google docs list. This rare, organized archival data made this site possible. 
                    Also special thank you to 1001tracklists and all archivers who have maintained recordings of past essential mixes.
                </p>
				<p>
					Want to jump back in? <Link className="text-neutral-200 hover:underline" href="/mixes">Browse all mixes</Link>.
				</p>
			</section>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-1">
			<span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
			<span className="text-xl font-semibold tabular-nums text-neutral-100">{value}</span>
		</div>
	);
}
