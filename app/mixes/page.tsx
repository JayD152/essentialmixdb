import { prisma } from '../../lib/prisma';
import { SearchBar } from '../../components/SearchBar';
import { MixCard } from '../../components/MixCard';
import Link from 'next/link';

interface EnhancedSearchParams { search?: string; page?: string; sort?: string; layout?: string }

interface Props { searchParams: EnhancedSearchParams }

export default async function MixesPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 48;
  const search = searchParams.search?.trim();
  const sort = (searchParams.sort || 'number-asc').toLowerCase();
  const layout = (searchParams.layout || 'grid');
  const where = search ? {
    OR: [
      { artist: { contains: search, mode: 'insensitive' } },
      { number: isNaN(Number(search)) ? undefined : Number(search) }
    ].filter(Boolean) as any
  } : {};
  const orderBy = (() => {
    switch (sort) {
      case 'number-desc': return { number: 'desc' } as const;
      case 'date-desc': return { releaseDate: 'desc' } as const;
      case 'date-asc': return { releaseDate: 'asc' } as const;
      case 'artist-asc': return { artist: 'asc' } as const;
      case 'artist-desc': return { artist: 'desc' } as const;
      default: return { number: 'asc' } as const;
    }
  })();

  const [items, total] = await Promise.all([
    prisma.mix.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.mix.count({ where })
  ]);
  const pages = Math.ceil(total / pageSize);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[300px] space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-accent-pink to-pink-400 bg-clip-text text-transparent">All Essential Mixes</h1>
          <SearchBar placeholder="Search mixes..." />
        </div>
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-neutral-500">Sort:</span>
            {['number-asc','number-desc','date-desc','date-asc','artist-asc','artist-desc'].map(opt => {
              const labelMap: Record<string,string> = {
                'number-asc':'Number ↑','number-desc':'Number ↓','date-desc':'Newest','date-asc':'Oldest','artist-asc':'Artist A-Z','artist-desc':'Artist Z-A'
              };
              const params = new URLSearchParams({ ...(search?{search}:{}), sort: opt, layout, page: '1' });
              return (
                <Link key={opt} href={`?${params.toString()}`} className={`px-3 py-1 rounded-full border transition ${opt===sort? 'bg-neutral-800 border-neutral-600':'border-neutral-800 hover:border-neutral-600'}`}>{labelMap[opt]}</Link>
              );
            })}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-neutral-500">Layout:</span>
            {['grid','dense'].map(mode => {
              const params = new URLSearchParams({ ...(search?{search}:{}), sort, layout: mode, page: '1' });
              return <Link key={mode} href={`?${params.toString()}`} className={`px-3 py-1 rounded-full border transition ${mode===layout? 'bg-neutral-800 border-neutral-600':'border-neutral-800 hover:border-neutral-600'}`}>{mode==='grid'?'Comfort':'Dense'}</Link>;
            })}
          </div>
          <p className="text-neutral-500">{total} mixes</p>
        </div>
      </div>
      <div className={layout==='dense' ? 'grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3' : 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'}>
  {items.map((m: typeof items[number]) => <MixCard key={m.id} mix={m} compact={layout==='dense'} />)}
      </div>
      {pages > 1 && (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <a key={p} href={`?${new URLSearchParams({ ...(search ? { search } : {}), page: p.toString() }).toString()}`} className={`px-3 py-1 rounded-full border text-xs ${p === page ? 'bg-neutral-800 border-neutral-600' : 'border-neutral-800 hover:border-neutral-600'}`}>{p}</a>
          ))}
        </div>
      )}
    </div>
  );
}
