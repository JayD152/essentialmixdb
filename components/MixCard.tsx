import Link from 'next/link';
import { LibraryButton } from './LibraryButton';
import clsx from 'clsx';

interface Props {
  mix: any & { recommended?: boolean };
  showLibraryButton?: boolean;
  compact?: boolean;
}

function gradientFallback(mix: any) {
  const hue = (mix.number * 37) % 360;
  const hue2 = (hue + 30) % 360;
  return `linear-gradient(140deg,hsl(${hue} 18% 24%),hsl(${hue2} 22% 18%))`;
}

export function MixCard({ mix, showLibraryButton = true, compact = false }: Props) {
  if (!mix || !Number.isFinite(Number(mix.number)) || !mix.releaseDate || !mix.artist) {
    return null;
  }
  const year = new Date(mix.releaseDate).getFullYear();
  const bg = gradientFallback(mix);
  return (
    <div
      className={clsx(
        'group relative overflow-hidden flex flex-col shadow-sm ring-1 ring-neutral-800/60 bg-neutral-900/70 backdrop-blur-sm transition-all duration-300',
        'hover:ring-neutral-600 hover:-translate-y-0.5',
        compact ? 'rounded-2xl' : 'rounded-[2.25rem]' // give larger cards extra curvature
      )}
    >
      <Link
        href={`/mix/${mix.number}`}
        className={clsx(
          'relative block w-full overflow-hidden',
          compact ? 'aspect-[5/3]' : 'aspect-square'
        )}
        style={{ background: bg }}
        aria-label={`Essential Mix #${mix.number} by ${mix.artist}`}
      >
        {mix.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mix.artworkUrl}
            alt={mix.artist}
            className={clsx(
              'absolute inset-0 w-full h-full object-cover object-center scale-[1.015] transition-all duration-500',
              'blur-[1px] brightness-[0.92] contrast-[1.06] group-hover:brightness-[0.78]'
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-black text-6xl md:text-7xl tracking-tight text-white/30 select-none">
            <span
              className="relative drop-shadow-[0_0_4px_rgba(0,0,0,0.65)] [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_0_6px_rgba(0,0,0,0.55),0_0_18px_rgba(0,0,0,0.45)]"
              style={{ WebkitTextStroke: '2px rgba(0,0,0,0.55)' }}
            >
              {mix.number}
            </span>
          </div>
        )}
        {/* Darkening + highlight overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/30 to-black/10 transition-opacity" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-70 transition-opacity bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.6)_85%)]" />
        {/* Large translucent number at bottom for artwork case (not too big) */}
        {mix.artworkUrl && (
          <div className="absolute bottom-1 left-2 leading-none select-none pointer-events-none">
            <div className="absolute -left-2 -bottom-1 w-24 h-16 rounded-full blur-xl opacity-60" style={{ background:'radial-gradient(circle at 30% 65%, rgba(0,0,0,0.55), transparent 70%)' }} />
            <span
              className="relative font-black text-5xl tracking-tight text-white/35 [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_0_8px_rgba(0,0,0,0.55)]"
              style={{ WebkitTextStroke: '1.5px rgba(0,0,0,0.6)' }}
            >{mix.number}</span>
          </div>
        )}
        {mix.recommended && (
          <span className="absolute top-2 right-2 bg-gradient-accent text-[10px] font-semibold px-2 py-1 rounded-full text-white shadow">
            Featured
          </span>
        )}
        {showLibraryButton && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <LibraryButton mixId={mix.id} />
          </div>
        )}
      </Link>
      <div className="flex-1 flex flex-col px-3 pb-3 pt-2 gap-1">
        <Link
          href={`/mix/${mix.number}`}
          className="font-medium text-sm leading-tight text-neutral-100 line-clamp-1 hover:text-white flex items-center gap-1"
        >
          <span>{mix.artist}</span>
          <span className="text-neutral-500">- {year}</span>
        </Link>
      </div>
    </div>
  );
}
