import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';
import { LibraryButton } from '../../../components/LibraryButton';
import { MixCard } from '../../../components/MixCard';
import { ArtworkBackdrop } from '../../../components/ArtworkBackdrop';
import { format } from 'date-fns';
import { ReviewForm } from '../../../components/ReviewForm';

interface Props { params: { number: string } }

export default async function MixDetailPage({ params }: Props) {
  const num = parseInt(params.number, 10);
  const mix = await prisma.mix.findFirst({
    where: { number: num },
    include: {
      tracks: { orderBy: { index: 'asc' } },
      reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
      recommended: true
    }
  }) as any;
  if (!mix) return notFound();
  mix.tracks = Array.isArray(mix.tracks) ? mix.tracks : [];
  mix.reviews = Array.isArray(mix.reviews) ? mix.reviews : [];

  // Fetch related (same genre) and "you might like" (recommended) mixes
  const [related, youMightLikeRaw] = await Promise.all([
    mix.genre ? prisma.mix.findMany({ where: { genre: mix.genre, id: { not: mix.id } }, orderBy: { releaseDate: 'desc' }, take: 6 }) : Promise.resolve([]),
    prisma.mix.findMany({ where: { recommended: { isNot: null }, id: { not: mix.id } }, include: { recommended: true }, orderBy: [ { recommended: { priority: 'desc' } }, { releaseDate: 'desc' } ], take: 6 })
  ]);
  const youMightLike = youMightLikeRaw.length ? youMightLikeRaw : await prisma.mix.findMany({ where: { id: { not: mix.id } }, orderBy: { releaseDate: 'desc' }, take: 6 });
  // derive accent hue from heroImageUrl (simple hash) or fallback
  const accentHue = (() => {
    if (!mix.heroImageUrl) return 340; // pink fallback
    let hash = 0;
    for (let i = 0; i < mix.heroImageUrl.length; i++) hash = (hash * 33 + mix.heroImageUrl.charCodeAt(i)) >>> 0;
    return hash % 360;
  })();
  const accentFrom = `hsl(${accentHue} 80% 55%)`;
  const accentTo = `hsl(${(accentHue + 40) % 360} 70% 50%)`;
  return (
    <div className="space-y-16 pt-6">
      <div className="relative px-0 z-10">
  <ArtworkBackdrop
    imageUrl={mix.heroImageUrl || mix.artworkUrl || ''}
    variant={mix.heroImageUrl ? 'sharp' : 'blur'}
    className="mx-auto rounded-[3.25rem] border border-white/10 shadow-lg shadow-black/40 max-w-7xl overflow-hidden"
  >
    <div className="relative group rounded-[inherit] z-10 px-6 py-10 md:py-12 flex flex-col md:flex-row gap-10 md:gap-12">
          <div className="w-52 h-52 rounded-[2.5rem] overflow-hidden ring-1 ring-white/15 bg-neutral-800/60 flex items-center justify-center text-neutral-300 text-sm shadow-md shadow-black/40">
            {mix.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mix.artworkUrl} alt={mix.title || mix.artist} className="w-full h-full object-cover" />
            ) : 'Artwork'}
          </div>
          <div className="absolute -inset-1 rounded-[inherit] opacity-0 group-hover:opacity-70 transition pointer-events-none bg-white/10 backdrop-blur-[1px]" />
        </div>
        <div className="flex-1 flex flex-col gap-8 px-6 pb-10">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight leading-tight flex flex-wrap items-center gap-4">
              <span className="text-white/60 font-light text-3xl drop-shadow">#{mix.number}</span>
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]">{mix.artist}</span>
            </h1>
            {/* Title removed per request; Essential Mixes primarily identified by number, artist, year */}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-[11px] text-white/90">
            <Meta label="Air Date" value={format(new Date(mix.releaseDate), 'PP')} />
            {mix.durationSeconds && <Meta label="Duration" value={formatDuration(mix.durationSeconds)} />}
            <Meta label="Mix Number" value={`#${mix.number}`} />
            {mix.genre && <Meta label="Genre" value={mix.genre} />}
            {mix.bpmLow && <Meta label="BPM Range" value={`${mix.bpmLow}${mix.bpmHigh?`-${mix.bpmHigh}`:''}`} />}
            {mix.location && <Meta label="Location" value={mix.location} />}
            {mix.audioPath && <Meta label="Audio" value={mix.audioPath.split('/').pop() || 'File'} />}
            {/* External BBC field intentionally hidden per request */}
            {(typeof mix.rating === 'number') && <Meta label="Rating" value={`${mix.rating.toFixed(1)} / 5`} />}
          </div>
          {(typeof mix.rating === 'number') && (
            <div className="flex items-center gap-2 text-sm text-white/90">
              <StarRow value={mix.rating} />
              <span className="text-white/60">{mix.rating.toFixed(1)}{mix.ratingCount ? ` • ${mix.ratingCount} reviews` : ''}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 items-center pt-2">
            {(mix.youtubeUrl || mix.audioPath) && <PlayButton audioPath={mix.audioPath || ''} youtubeUrl={mix.youtubeUrl} />}
            <LibraryButton mixId={mix.id} />
            <PlatformLinks mix={mix} />
            {mix.externalUrl && (
              <a
                href={mix.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 rounded-full border border-fuchsia-400/30 hover:border-fuchsia-300/60 transition bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 hover:from-fuchsia-500/40 hover:to-violet-500/40 backdrop-blur text-fuchsia-100 hover:text-white shadow shadow-black/30"
              >
                1001Tracklists
              </a>
            )}
            <button className="text-xs px-4 py-2 rounded-full border border-white/20 hover:border-white/40 transition bg-white/10 backdrop-blur text-white/80 hover:text-white">Share</button>
          </div>
        </div>
        </ArtworkBackdrop>
      </div>
      <section className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">Mix Bio</h2>
        <div className="text-sm text-neutral-200/90 whitespace-pre-wrap leading-relaxed bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
          {mix.bio || 'No bio written yet.'}
        </div>
      </section>

      {mix.tracks.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Tracklist</h2>
            <span className="text-xs text-neutral-500">{mix.tracks.length} tracks</span>
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/[0.03] backdrop-blur">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wide bg-white/5 backdrop-blur text-neutral-400">
              <div className="col-span-1">#</div>
              <div className="col-span-2 sm:col-span-1">Time</div>
              <div className="col-span-5 sm:col-span-5">Track</div>
              <div className="col-span-4 sm:col-span-3">Artist</div>
              <div className="hidden sm:block col-span-2">Label</div>
            </div>
            <div className="divide-y divide-white/10">
              {mix.tracks.map((t: typeof mix.tracks[number]) => (
                <div key={t.id} className="grid grid-cols-12 gap-4 px-4 py-2 text-[11px] hover:bg-white/5 transition group">
                  <div className="col-span-1 font-mono text-neutral-500 group-hover:text-neutral-300">{String(t.index).padStart(2,'0')}</div>
                  <div className="col-span-2 sm:col-span-1 font-mono text-neutral-500 group-hover:text-neutral-300">{formatTime(t.timecodeSeconds)}</div>
                  <div className="col-span-5 sm:col-span-5 font-medium text-neutral-100 group-hover:text-white line-clamp-1">{t.title}</div>
                  <div className="col-span-4 sm:col-span-3 text-neutral-400 group-hover:text-neutral-300 line-clamp-1">{t.artist || '—'}</div>
                  <div className="hidden sm:block col-span-2 text-neutral-500 group-hover:text-neutral-300 line-clamp-1">{t.label || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related & You Might Like sections */}
      {(related.length > 0 || youMightLike.length > 0) && (
        <div className="space-y-12">
          {related.length > 0 && (
            <section className="space-y-5">
              <h2 className="text-xl font-semibold tracking-tight">Related Mixes</h2>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {related.map(r => <MixCard key={r.id} mix={r as any} />)}
              </div>
            </section>
          )}
          {youMightLike.length > 0 && (
            <section className="space-y-5">
              <h2 className="text-xl font-semibold tracking-tight">You Might Also Like</h2>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {youMightLike.map(r => <MixCard key={r.id} mix={r as any} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Reviews</h2>
          <a href={`#review-form`} className="text-xs px-3 py-1 rounded-full border border-neutral-700 hover:border-neutral-500 transition">Write Review</a>
        </div>
        <div className="space-y-4">
          {mix.reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet — be the first.</p>}
          {mix.reviews.map((r: typeof mix.reviews[number]) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-100/95">{r.userName}</p>
                <StarRow value={r.rating} size={12} />
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{r.body}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">{format(r.createdAt, 'PP')}</p>
            </div>
          ))}
        </div>
        <div id="review-form">
          <ReviewForm mixNumber={mix.number} />
        </div>
      </section>
    </div>
  );
}

function formatDuration(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h>0?`${h}h`:null, m>0?`${m}m`:null, s>0?`${s}s`:null].filter(Boolean).join(' ');
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="uppercase tracking-wider text-[11px] text-neutral-400">{label}</p>
      <p className="text-neutral-100 text-[15px] font-medium leading-snug line-clamp-1">{value}</p>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2,'0');
  const s = (seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value); // simple representation
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i < full ? 'text-accent-pink' : 'text-neutral-700'} fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
      ))}
    </div>
  );
}

function PlayButton({ audioPath, youtubeUrl }: { audioPath: string; youtubeUrl?: string | null }) {
  const href = youtubeUrl || audioPath;
  const isYouTube = !!youtubeUrl;
  return (
    <a href={href} target={isYouTube ? '_blank' : undefined} rel={isYouTube ? 'noopener noreferrer' : undefined} className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-pink to-pink-500 text-white text-xs font-medium px-5 py-2 shadow hover:shadow-pink-500/25 transition">
      {isYouTube ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M23.5 6.2s-.2-1.7-.8-2.5c-.7-.8-1.5-.8-1.9-.9C17.9 2.5 12 2.5 12 2.5h0s-5.9 0-8.8.3c-.4.1-1.2.1-1.9.9C.7 4.5.5 6.2.5 6.2S.3 8.3.3 10.5v1.9c0 2.2.2 4.3.2 4.3s.2 1.7.8 2.5c.7.8 1.7.8 2.2.9 1.6.1 6.8.3 8.5.3 0 0 5.9 0 8.8-.3.4-.1 1.2-.1 1.9-.9.6-.8.8-2.5.8-2.5s.2-2.2.2-4.3v-1.9c0-2.2-.2-4.3-.2-4.3ZM9.8 14.9V7.9l6.3 3.5-6.3 3.5Z"/></svg>
      ) : (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="opacity-90 group-hover:opacity-100"><path d="M8 5v14l11-7z" /></svg>
      )}
      <span>{isYouTube ? 'Play on YouTube' : 'Play Mix'}</span>
    </a>
  );
}


function PlatformLinks({ mix }: { mix: any }) {
  const links: { key: string; url?: string | null; label: string; color: string }[] = [
    { key: 'soundcloudUrl', url: mix.soundcloudUrl, label: 'SoundCloud', color: 'from-orange-500 to-amber-500' },
    { key: 'mixcloudUrl', url: mix.mixcloudUrl, label: 'Mixcloud', color: 'from-sky-500 to-blue-500' },
    { key: 'spotifyUrl', url: mix.spotifyUrl, label: 'Spotify', color: 'from-emerald-500 to-green-500' },
  ];
  const active = links.filter(l => !!l.url);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {active.map(l => (
        <a key={l.key} href={l.url!} target="_blank" rel="noopener noreferrer" className={`text-[10px] uppercase tracking-wide font-medium rounded-full px-3 py-1.5 bg-gradient-to-r ${l.color} text-white shadow shadow-black/40 hover:brightness-110 transition`}>{l.label}</a>
      ))}
    </div>
  );
}
