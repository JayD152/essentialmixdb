import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { MixCard } from '../../components/MixCard';
import { notFound } from 'next/navigation';

interface Props { searchParams: { artist?: string; q?: string } }

export default async function ArtistsPage({ searchParams }: Props) {
  const active = (searchParams.artist || '').trim();
  const q = (searchParams.q || '').trim();

  // Get artists with counts using groupBy for efficiency
  const grouped = await prisma.mix.groupBy({ by: ['artist'], _count: { artist: true }, orderBy: { artist: 'asc' } });
  let artists = grouped.map(g => ({ name: g.artist, count: g._count.artist })) as { name: string; count: number }[];
  if (q) {
    const lower = q.toLowerCase();
    artists = artists.filter(a => a.name.toLowerCase().includes(lower));
  }
  if (artists.length === 0) {
    return (
      <div className="space-y-6">
        <ArtistSearchForm initialQ={q} />
        <p className="text-sm text-neutral-500">No artists match that search.</p>
        <Link href="/artists" className="text-xs underline text-neutral-400 hover:text-white">Reset</Link>
      </div>
    );
  }
  const currentArtist = active && artists.some(a => a.name === active) ? active : artists[0].name;

  const mixes = await prisma.mix.findMany({ where: { artist: currentArtist }, orderBy: { releaseDate: 'desc' } });

  // Group artists by first letter for sidebar
  const byLetter: Record<string, { name: string; count: number }[]> = {};
  for (const a of artists) {
    const letter = a.name.charAt(0).toUpperCase();
    (byLetter[letter] ||= []).push(a);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <div className="flex flex-col md:flex-row gap-10">
      <aside className="md:w-72 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Artists</h1>
        </div>
        <ArtistSearchForm initialQ={q} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur max-h-[70vh] overflow-auto p-2 text-sm space-y-4">
          {letters.map(letter => (
            <div key={letter} id={`letter-${letter}`} className="space-y-1">
              <div className="sticky top-0 z-10 -mx-2 px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-neutral-400/80 bg-neutral-950/70 backdrop-blur">
                {letter}
              </div>
              <ul className="space-y-0.5">
                {byLetter[letter].map(a => {
                  const selected = a.name === currentArtist;
                  return (
                    <li key={a.name}>
                      <Link
                        href={`/artists?artist=${encodeURIComponent(a.name)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                        className={`group flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition ${selected ? 'bg-white/15 text-white font-medium shadow-inner shadow-black/20' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                      >
                        <span className="truncate">{a.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${selected ? 'border-white/30 bg-white/10 text-white/90' : 'border-white/10 text-neutral-500 group-hover:border-white/25 group-hover:text-neutral-300'}`}>{a.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 pt-2 text-[10px]">
          {letters.map(l => (
            <a key={l} href={`#letter-${l}`} className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition">{l}</a>
          ))}
        </div>
      </aside>
      <section className="flex-1 space-y-8">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent-pink to-pink-400 bg-clip-text text-transparent">{currentArtist}</h2>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">{mixes.length} mix{mixes.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        {mixes.length === 0 && <p className="text-sm text-neutral-400">No mixes found for this artist.</p>}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {mixes.map(m => <MixCard key={m.id} mix={m} />)}
        </div>
      </section>
    </div>
  );
}

function ArtistSearchForm({ initialQ }: { initialQ: string }) {
  const placeholder = 'Filter artists...';
  return (
    <form className="relative" action="/artists" method="get">
      <input
        type="text"
        name="q"
        defaultValue={initialQ}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:ring-0 px-3 py-2 text-sm placeholder:text-neutral-500 outline-none"
      />
      <button className="absolute right-1 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/10" type="submit">Go</button>
    </form>
  );
}
