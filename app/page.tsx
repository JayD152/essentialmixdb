import { LatestSection } from '../components/LatestSection';
import { RecommendedSection } from '../components/RecommendedSection';
import { SearchBar } from '../components/SearchBar';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-10">
        <div className="relative max-w-5xl">
          <blockquote className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] space-y-6">
            <p className="font-semibold italic">“It was deep, it was soulful, it was techno, it was disco!”</p>
            <p className="font-semibold italic">“I must have went to house heaven, because nothing’s that divine.”</p>
          </blockquote>
          <div className="mt-8 w-24 h-1 bg-gradient-to-r from-accent-pink to-pink-500 rounded-full" />
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-bold gradient-text">Essential Mix DB</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base">Browse and collect every BBC Radio 1 Essential Mix. Search by number or artist, build your personal library, and rediscover historic sets.</p>
          <SearchBar autoFocus />
        </div>
      </section>
      <LatestSection />
      <RecommendedSection />
    </div>
  );
}
