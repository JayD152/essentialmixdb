"use client";
import { useState, useMemo, useTransition } from 'react';

interface UserRow {
  id: string;
  name: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

export default function AdminUsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    return f ? users.filter(u => (u.name||'').toLowerCase().includes(f) || u.id.includes(f)) : users;
  }, [users, filter]);

  function mutate(id: string, patch: Partial<UserRow>) {
    setUsers(u => u.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function toggle(id: string, field: 'isAdmin'|'isBanned', value: boolean) {
    startTransition(async () => {
      mutate(id, { [field]: value } as any);
      const res = await fetch(`/api/admin/users/${id}/${field==='isAdmin'?'admin':'ban'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field==='isAdmin'?'admin':'banned']: value }) });
      if (!res.ok) {
        // revert
        mutate(id, { [field]: !value } as any);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter users" className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/60 min-w-[240px]" />
        {isPending && <span className="text-xs text-neutral-500">Saving…</span>}
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">{filtered.length} shown</span>
      </div>
      <div className="overflow-auto rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur">
        <table className="min-w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-neutral-400 bg-white/[0.04]">
            <tr>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">ID</th>
              <th className="py-2 px-3">Admin</th>
              <th className="py-2 px-3">Banned</th>
              <th className="py-2 px-3 text-left">Created</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/5 align-middle">
                <td className="py-2 px-3 font-medium text-neutral-200 max-w-[160px] truncate" title={u.name||''}>{u.name || '—'}</td>
                <td className="py-2 px-3 text-[10px] text-neutral-500 max-w-[140px] truncate" title={u.id}>{u.id.slice(0,12)}…</td>
                <td className="py-2 px-3 text-center">
                  <button onClick={()=>toggle(u.id,'isAdmin',!u.isAdmin)} className={['px-3 py-1 rounded-full text-[10px] border transition', u.isAdmin ? 'border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/10' : 'border-neutral-500/40 text-neutral-300 hover:bg-neutral-600/10'].join(' ')}>{u.isAdmin? 'Yes':'No'}</button>
                </td>
                <td className="py-2 px-3 text-center">
                  <button onClick={()=>toggle(u.id,'isBanned',!u.isBanned)} className={['px-3 py-1 rounded-full text-[10px] border transition', u.isBanned ? 'border-rose-400/50 text-rose-300 hover:bg-rose-500/10' : 'border-neutral-500/40 text-neutral-300 hover:bg-neutral-600/10'].join(' ')}>{u.isBanned? 'Yes':'No'}</button>
                </td>
                <td className="py-2 px-3 text-[11px] text-neutral-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-2 px-3 text-right">
                  <button className="text-[10px] px-3 py-1 rounded-full border border-white/15 text-neutral-300 hover:bg-white/10" disabled>Reset PW</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-xs text-neutral-500">No users match filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
