"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface Props { initial: string; isAdmin?: boolean; }

export function AccountMenu({ initial, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (!ref.current) return; if (!ref.current.contains(e.target as any)) setOpen(false); }
    if (open) document.addEventListener('mousedown', onDoc); else document.removeEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const itemsRef = useRef<HTMLButtonElement[] | (HTMLAnchorElement | null)[]>([]);
  const focusItem = useCallback((idx: number) => {
    const el = itemsRef.current[idx] as HTMLElement | undefined;
    if (el) el.focus();
  }, []);

  function onKeyHost(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    } else if (open) {
      if (e.key === 'Escape') { setOpen(false); (e.currentTarget as HTMLElement).focus(); }
    }
  }

  function onMenuKey(e: React.KeyboardEvent) {
    const count = itemsRef.current.length;
    const idx = itemsRef.current.findIndex(el => el === document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem((idx + 1) % count); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem((idx - 1 + count) % count); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(count - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) setTimeout(() => focusItem(0), 10); }}
        onKeyDown={onKeyHost}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 rounded-md"
      >
        <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/70 to-fuchsia-600/70 ring-1 ring-white/15 flex items-center justify-center text-[13px] font-medium text-white shadow shadow-black/40 group-hover:brightness-110 transition">
          {initial}
        </span>
        <svg width={14} height={14} viewBox="0 0 24 24" className={`text-neutral-400 group-hover:text-neutral-200 transition ${open ? 'rotate-180' : ''}`} fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-3 w-52 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-lg shadow-black/50 p-2 text-sm z-50 animate-[fadeScale_.18s_ease] origin-top-right"
          onKeyDown={onMenuKey}
        >
          {isAdmin && (
            <Link
              ref={el => { itemsRef.current[0] = el; }}
              onClick={() => setOpen(false)}
              href="/admin"
              role="menuitem"
              className="block px-3 py-2 rounded-md hover:bg-pink-500/20 text-pink-300 focus:outline-none focus:bg-pink-500/20"
              tabIndex={0}
            >Admin Dashboard</Link>
          )}
          <Link
            ref={el => { itemsRef.current[isAdmin ? 1 : 0] = el; }}
            onClick={() => setOpen(false)}
            href="/account"
            role="menuitem"
            className="block px-3 py-2 rounded-md hover:bg-white/10 text-neutral-200 focus:outline-none focus:bg-white/10"
            tabIndex={0}
          >Account</Link>
          <Link
            ref={el => { itemsRef.current[isAdmin ? 2 : 1] = el; }}
            onClick={() => setOpen(false)}
            href="/library"
            role="menuitem"
            className="block px-3 py-2 rounded-md hover:bg-white/10 text-neutral-300 focus:outline-none focus:bg-white/10"
            tabIndex={0}
          >My Library</Link>
          <button
            ref={el => { itemsRef.current[isAdmin ? 3 : 2] = el as any; }}
            role="menuitem"
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 text-neutral-300 focus:outline-none focus:bg-white/10"
            tabIndex={0}
          >Sign Out</button>
        </div>
      )}
    </div>
  );
}
