"use client";
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export function ReviewForm({ mixNumber, onSubmitted }: { mixNumber: number; onSubmitted?: () => void }) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false); setLoading(true);
    if (!session) { signIn(undefined, { callbackUrl: `/mix/${mixNumber}` }); return; }
    try {
      const res = await fetch(`/api/mixes/${mixNumber}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, text }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({ error: 'Failed'}));
        throw new Error(j.error || 'Request failed');
      }
      setSuccess(true); setText(''); setRating(5);
      onSubmitted?.();
    } catch (err:any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!session) {
    return (
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950/60 text-center space-y-4">
        <p className="text-sm text-neutral-300">You must be signed in to leave a review.</p>
        <button onClick={() => signIn(undefined, { callbackUrl: `/mix/${mixNumber}#review-form` })} className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-accent-pink to-pink-500 text-white font-medium">Sign In to Review</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="text-xs text-neutral-400 flex items-center gap-2">Posting as <span className="text-neutral-200 font-medium">{session.user?.name || 'User'}</span></div>
        <select className="rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-pink" value={rating} onChange={e=>setRating(parseInt(e.target.value,10))}>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
        </select>
      </div>
      <textarea className="w-full h-24 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent-pink" placeholder="What did you think?" value={text} onChange={e=>setText(e.target.value)} required minLength={3} />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Review submitted!</p>}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">Share your perspective</p>
        <button disabled={loading} className="text-xs px-4 py-2 rounded-full bg-gradient-to-r from-accent-pink to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? 'Posting...' : 'Post Review'}
        </button>
      </div>
    </form>
  );
}