'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || password.length < 4) { setError('Provide username and password (min 4).'); return; }
    if (mode === 'register' && password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await signIn('credentials', { redirect: false, username, password, mode, callbackUrl: '/' });
      if (!res || res.error) {
        setError(mode === 'register' ? 'Registration failed (maybe name taken)' : 'Invalid credentials');
      } else if (res.ok) {
        window.location.href = res.url || '/';
      }
    } catch (err: any) {
      setError('Auth error');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent-pink to-pink-400 bg-clip-text text-transparent">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
        <p className="text-sm text-neutral-500">{mode==='login'? 'Welcome back.':'Register a new account.'}</p>
      </div>
      <div className="flex gap-2 text-[11px] uppercase tracking-wider">
        <button onClick={()=>setMode('login')} className={"px-3 py-1.5 rounded-full border transition " + (mode==='login' ? 'border-pink-400 text-pink-300 bg-pink-500/10' : 'border-white/10 text-neutral-400 hover:border-white/25')}>Login</button>
        <button onClick={()=>setMode('register')} className={"px-3 py-1.5 rounded-full border transition " + (mode==='register' ? 'border-pink-400 text-pink-300 bg-pink-500/10' : 'border-white/10 text-neutral-400 hover:border-white/25')}>Register</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs text-neutral-400">Username</span>
          <input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="yourname" className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink/60" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-400">Password</span>
          <input autoComplete={mode==='login'?'current-password':'new-password'} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••" className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink/60" />
        </label>
        {mode === 'register' && (
          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">Confirm Password</span>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••" className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink/60" />
          </label>
        )}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-accent-pink to-pink-500 text-white font-medium py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed">{loading? (mode==='login'?'Signing in...':'Creating...') : (mode==='login'? 'Sign In':'Register')}</button>
      </form>
      <p className="text-[11px] text-neutral-500 leading-relaxed">Usernames are unique. Passwords are stored hashed. If you forget your password we currently cannot recover it—plan a reset flow later.</p>
    </div>
  );
}
