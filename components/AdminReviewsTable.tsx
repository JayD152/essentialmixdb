"use client";
import { useState, useTransition } from 'react';

interface ReviewRowData {
  id: number;
  mix: { number: number; artist: string };
  userName: string;
  rating: number;
  body: string;
  createdAt: string;
  userId?: string | null;
}

export default function AdminReviewsTable({ initialReviews }: { initialReviews: ReviewRowData[] }) {
  const [reviews, setReviews] = useState<ReviewRowData[]>(initialReviews);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const f = filter.toLowerCase();
  const filtered = f
    ? reviews.filter(r =>
        r.userName.toLowerCase().includes(f) ||
        r.body.toLowerCase().includes(f) ||
        String(r.mix.number).includes(f) ||
        (r.userId && r.userId.includes(filter))
      )
    : reviews;

  async function deleteReview(id: number) {
    if (!confirm('Delete this review?')) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) setReviews(rs => rs.filter(r => r.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Filter by user, text, mix number..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 min-w-[240px] rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/60"
        />
        {isPending && <span className="text-xs text-neutral-500">Working…</span>}
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">{filtered.length} shown</span>
      </div>
      <div className="overflow-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
        <table className="min-w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-neutral-400 bg-white/[0.04]">
            <tr className="text-left">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Mix</th>
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">User ID</th>
              <th className="py-2 px-3">Rating</th>
              <th className="py-2 px-3">Body</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map(r => (
              <tr key={r.id} className="align-top hover:bg-white/5">
                <td className="py-2 px-3 text-[11px] text-neutral-500">{r.id}</td>
                <td className="py-2 px-3 whitespace-nowrap text-neutral-200">
                  <a href={`/mix/${r.mix.number}`} className="hover:underline">#{r.mix.number} {r.mix.artist}</a>
                </td>
                <td className="py-2 px-3 text-neutral-300 max-w-[140px] truncate" title={r.userName}>{r.userName}</td>
                <td className="py-2 px-3 text-[10px] text-neutral-500 max-w-[120px] truncate" title={r.userId || ''}>{r.userId ? r.userId.slice(0,10)+'…' : '—'}</td>
                <td className="py-2 px-3 text-neutral-200">{r.rating}★</td>
                <td className="py-2 px-3 max-w-md">
                  <p className="text-neutral-300 whitespace-pre-wrap leading-snug line-clamp-4" title={r.body}>{r.body}</p>
                </td>
                <td className="py-2 px-3 text-[11px] text-neutral-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="py-2 px-3 flex flex-col gap-1 min-w-[120px]">
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="text-[10px] px-3 py-1 rounded-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                  >Delete</button>
                  {r.userId && (
                    <BanToggle userId={r.userId} />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-10 text-center text-xs text-neutral-500">No reviews match filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BanToggle({ userId }: { userId: string }) {
  const [banned, setBanned] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  async function toggle(next: boolean) {
    startTransition(async () => {
      await fetch(`/api/admin/users/${userId}/ban`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ banned: next }) });
      setBanned(next);
    });
  }

  return (
    <button
      onClick={() => toggle(!(banned ?? false))}
      className={[
        'text-[10px] px-3 py-1 rounded-full border transition',
        banned ? 'border-amber-400/50 text-amber-300 hover:bg-amber-500/10' : 'border-neutral-500/40 text-neutral-300 hover:bg-neutral-500/10'
      ].join(' ')}
      title={banned ? 'Unban user' : 'Ban user'}
      disabled={pending}
    >
      {pending ? '...' : banned ? 'Unban' : 'Ban'}
    </button>
  );
}
