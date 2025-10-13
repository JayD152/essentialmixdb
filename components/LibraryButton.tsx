'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface Props { mixId: number; }

export function LibraryButton({ mixId }: Props) {
  const { data: session, status } = useSession();
  const [inLibrary, setInLibrary] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hovering, setHovering] = useState(false);

  // Lazy load membership state if signed in
  useEffect(() => {
    let cancelled = false;
    if (session?.user && inLibrary === null) {
      fetch('/api/library')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (cancelled || !data) return;
          const exists = (data.items as any[]).some(e => e.mixId === mixId);
          setInLibrary(exists);
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [session, mixId, inLibrary]);

  async function toggle() {
    if (!session) return signIn(undefined, { callbackUrl: `/mix/${mixId}` });
    startTransition(async () => {
      if (inLibrary) {
        // heartbreak effect BEFORE or in parallel to request
        heartbreakFall(btnRef.current || undefined);
        await fetch(`/api/library/${mixId}`, { method: 'DELETE' });
        setInLibrary(false);
      } else {
        await fetch(`/api/library`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mixId }) });
        setInLibrary(true);
        romanticFlash(btnRef.current || undefined);
      }
    });
  }

  const active = !!inLibrary;
  return (
    <button
      ref={btnRef}
      onClick={toggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-label={active ? 'Remove from library' : 'Add to library'}
      aria-pressed={active}
      disabled={status === 'loading' || isPending}
      className={[
        'relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition backdrop-blur-sm overflow-visible',
        active ? 'border-pink-300/60 bg-pink-500/20 hover:bg-pink-500/30 animate-[heartPulse_900ms_ease]' : 'border-white/20 bg-white/10 hover:bg-white/20',
        'disabled:opacity-50'
      ].join(' ')}
    >
      <HeartIcon filled={active} className={active ? 'text-pink-300 drop-shadow-[0_0_6px_rgba(255,140,170,0.6)] scale-110' : 'text-white/70 group-hover:text-white'} />
      <span className="sr-only">{active ? 'In Library' : 'Add to Library'}</span>
      {!session && hovering && (
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/90 text-[10px] px-2 py-1 rounded border border-neutral-700 text-neutral-300 shadow-lg shadow-black/40">Sign in to save</span>
      )}
    </button>
  );
}

function HeartIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={"w-5 h-5 transition-colors " + className} fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C6.4 16.36 4 13.28 4 9.86 4 7.21 6.01 5 8.57 5c1.54 0 3.04.81 3.93 2.09A4.77 4.77 0 0 1 16.43 5C18.99 5 21 7.21 21 9.86c0 3.42-2.4 6.5-6.55 10.17L12 21.35z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={"w-5 h-5 transition-colors " + className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78-.11L12 5.55l-1.06-1.05a5.5 5.5 0 0 0-7.78.11 5.5 5.5 0 0 0 .11 7.78l1.06 1.05L12 21.35l7.67-7.86 1.06-1.05a5.5 5.5 0 0 0 .11-7.78z" />
    </svg>
  );
}

function romanticFlash(anchor?: HTMLElement) {
  try {
    injectOnce();
    // Soft page veil
    const veil = document.createElement('div');
    veil.className = 'fixed inset-0 pointer-events-none z-[9998] opacity-0';
    veil.style.background = 'radial-gradient(circle at 50% 45%, rgba(255,170,190,0.45), rgba(255,110,150,0.15) 55%, rgba(255,90,140,0.08) 70%, transparent 85%)';
    veil.style.mixBlendMode = 'screen';
    veil.style.transition = 'opacity 220ms ease, transform 400ms ease';
    veil.style.transform = 'scale(1.03)';
    document.body.appendChild(veil);
    requestAnimationFrame(() => {
      veil.style.opacity = '1';
      veil.style.transform = 'scale(1)';
    });
    setTimeout(() => { veil.style.opacity = '0'; }, 320);
    setTimeout(() => { veil.remove(); }, 900);

    // Floating mini hearts near anchor (or center)
    const origin = anchor?.getBoundingClientRect();
    const baseX = origin ? origin.left + origin.width / 2 : window.innerWidth / 2;
    const baseY = origin ? origin.top + window.scrollY : window.innerHeight / 2;
    for (let i = 0; i < 6; i++) {
      spawnHeart(baseX, baseY, i * 40);
    }
  } catch {/* ignore */}
}

function spawnHeart(x: number, y: number, delay = 0) {
  const h = document.createElement('div');
  const size = 10 + Math.random() * 12;
  h.className = 'pointer-events-none fixed z-[9999]';
  h.style.left = x - size / 2 + (Math.random() * 40 - 20) + 'px';
  h.style.top = y + (Math.random() * 20 - 10) + 'px';
  h.style.width = size + 'px';
  h.style.height = size + 'px';
  h.style.opacity = '0';
  h.style.transform = 'translateY(0) scale(0.6)';
  h.style.animation = `heartFloat ${800 + Math.random()*400}ms cubic-bezier(.33,.62,.23,.99) ${delay}ms forwards`;
  h.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C6.4 16.36 4 13.28 4 9.86 4 7.21 6.01 5 8.57 5c1.54 0 3.04.81 3.93 2.09A4.77 4.77 0 0 1 16.43 5C18.99 5 21 7.21 21 9.86c0 3.42-2.4 6.5-6.55 10.17L12 21.35z"/></svg>';
  const hue = 330 + Math.random()*15; // soft pink range
  h.style.color = `hsl(${hue} 85% ${60 + Math.random()*15}%)`;
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 2000);
}

let injected = false;
function injectOnce() {
  if (injected) return; injected = true;
  const style = document.createElement('style');
  style.innerHTML = `@keyframes heartFloat {0%{opacity:0;transform:translateY(0) scale(.6) rotate(0deg);}15%{opacity:1;}70%{opacity:1;}100%{opacity:0;transform:translateY(-90px) scale(1.05) rotate(8deg);} }
  @keyframes heartPulse {0%{transform:scale(1);}30%{transform:scale(1.18);}55%{transform:scale(0.94);}75%{transform:scale(1.08);}100%{transform:scale(1);} }
  @keyframes heartFall {0%{opacity:0;transform:translate(-50%,-10%) scale(.9) rotate(0deg);}12%{opacity:1;transform:translate(-50%,0) scale(1);}55%{opacity:1;}100%{opacity:0;transform:translate(-50%,160px) scale(.9) rotate(25deg);} }
  @keyframes heartCrack {0%{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);}40%{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);}55%{clip-path:polygon(0 0,52% 0,52% 100%,0 100%);}100%{clip-path:polygon(0 0,52% 0,52% 100%,0 100%);} }
  @keyframes shardLeft {0%{transform:translate(0,0) rotate(0);}100%{transform:translate(-35px,140px) rotate(-35deg);} }
  @keyframes shardRight {0%{transform:translate(0,0) rotate(0);}100%{transform:translate(40px,150px) rotate(40deg);} }`;
  document.head.appendChild(style);
}

// Heartbreak effect when removing from library
function heartbreakFall(anchor?: HTMLElement) {
  try {
    injectOnce();
    const rect = anchor?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 + window.scrollX : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 + window.scrollY : window.innerHeight / 2;

    // Container
    const wrap = document.createElement('div');
    wrap.className = 'pointer-events-none fixed z-[9999]';
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    wrap.style.width = '0';
    wrap.style.height = '0';
    document.body.appendChild(wrap);

    // Whole heart (cracks mid-fall)
    const base = document.createElement('div');
    base.style.position = 'absolute';
    base.style.left = '0';
    base.style.top = '0';
    base.style.transform = 'translate(-50%,-50%)';
    base.style.animation = 'heartFall 1200ms cubic-bezier(.32,.82,.26,.99) forwards';
    base.style.filter = 'drop-shadow(0 2px 4px rgba(255,110,150,0.4))';
    base.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M12 21.35l-1.45-1.32C6.4 16.36 4 13.28 4 9.86 4 7.21 6.01 5 8.57 5c1.54 0 3.04.81 3.93 2.09A4.77 4.77 0 0 1 16.43 5C18.99 5 21 7.21 21 9.86c0 3.42-2.4 6.5-6.55 10.17L12 21.35z"/></svg>';
    base.style.color = 'hsl(345 80% 60%)';
    wrap.appendChild(base);

    // After crack moment, spawn shards & fade main
    setTimeout(() => {
      base.style.opacity = '0';
      spawnShard(true, x, y);
      spawnShard(false, x, y);
    }, 560); // sync with heartCrack mid animation

    setTimeout(() => { wrap.remove(); }, 1600);
  } catch {/* ignore */}
}

function spawnShard(left: boolean, x: number, y: number) {
  const shard = document.createElement('div');
  shard.className = 'pointer-events-none fixed z-[9998]';
  shard.style.left = x + 'px';
  shard.style.top = y + 'px';
  shard.style.width = '16px';
  shard.style.height = '16px';
  shard.style.transform = 'translate(-50%,-50%)';
  shard.style.animation = `${left ? 'shardLeft' : 'shardRight'} 950ms cubic-bezier(.32,.82,.26,.99) forwards`; 
  shard.style.opacity = '0.9';
  shard.style.filter = 'drop-shadow(0 2px 4px rgba(255,100,140,0.35))';
  shard.innerHTML = left
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35L6.4 16.36C4 13.28 4 9.86 4 9.86 4 7.21 6.01 5 8.57 5c1.54 0 3.04.81 3.93 2.09L12 8.5z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l5.6-4.99C20 16.36 22 13.28 22 9.86 22 7.21 19.99 5 17.43 5c-1.54 0-3.04.81-3.93 2.09L12 8.5z"/></svg>';
  shard.style.color = left ? 'hsl(350 78% 63%)' : 'hsl(343 72% 58%)';
  document.body.appendChild(shard);
  setTimeout(() => shard.remove(), 1200);
}
