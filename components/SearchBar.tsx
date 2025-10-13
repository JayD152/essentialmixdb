'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBar({ autoFocus, placeholder = 'Search by number or artist...' }: Props) {
  const [q, setQ] = useState('');
  const router = useRouter();
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/mixes?search=${encodeURIComponent(q.trim())}`); }} className="relative max-w-xl">
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full bg-neutral-900/70 border border-neutral-800 rounded-full px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink/60 placeholder:text-neutral-500"
        placeholder={placeholder}
      />
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm">Search</button>
    </form>
  );
}
