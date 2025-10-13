"use client";
import { useState } from 'react';

interface Props { user: { id: string; name: string | null | undefined }; stats: { libraryCount: number } }

export default function AccountClient({ user, stats }: Props) {
  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
      <form className="space-y-4 max-w-sm" onSubmit={async e => {
        e.preventDefault();
        setSaving(true);
        try {
          const res = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
          if (!res.ok) throw new Error('Failed');
          setSavedAt(new Date());
        } catch (e) {
          console.error(e);
        } finally {
          setSaving(false);
        }
      }}>
        <label className="block space-y-1 text-sm">
          <span className="text-neutral-400">Display Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink/60" />
        </label>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="px-5 py-2 rounded bg-gradient-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save Changes'}</button>
          {savedAt && <span className="text-xs text-green-400/80">Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
      </form>
      <div className="text-[11px] uppercase tracking-wider text-neutral-500">User ID: {user.id}</div>
    </section>
  );
}
