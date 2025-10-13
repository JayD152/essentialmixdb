"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TracklistEditor, EditableTrackRow, parseTimeToSeconds } from './TracklistEditor';

interface MixEditable {
  id: number; number: number; artist: string; title: string | null; releaseDate: string | Date; bio: string | null;
  durationSeconds: number | null; audioPath: string | null; genre: string | null; bpmLow: number | null; bpmHigh: number | null;
  location: string | null; heroImageUrl?: string | null; artworkUrl: string | null; externalUrl: string | null;
  soundcloudUrl?: string | null; mixcloudUrl?: string | null; youtubeUrl?: string | null; spotifyUrl?: string | null;
}

export function AdminEditMixForm({ mix }: { mix: MixEditable }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tracklistEnabled, setTracklistEnabled] = useState(false);
  const [tracks, setTracks] = useState<EditableTrackRow[]>([]);

  // fetch existing tracks on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/mixes/${mix.id}/tracks`).then(r => r.ok ? r.json() : Promise.reject()).then(j => {
      if (cancelled) return;
      if (Array.isArray(j.tracks) && j.tracks.length) {
        setTracklistEnabled(true);
        setTracks(j.tracks.map((t: any) => ({ id: t.id, title: t.title, artist: t.artist || '', label: t.label || '', time: secondsToTime(t.timecodeSeconds) })));
      }
    }).catch(()=>{});
    return () => { cancelled = true; };
  }, [mix.id]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setSuccess(false);
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const payload: any = { ...raw };
    ['number','durationSeconds','bpmLow','bpmHigh'].forEach(k => { if (payload[k]) payload[k] = Number(payload[k]); else delete payload[k]; });
    // IMPORTANT: Do not send tracklist fields in PATCH. Separate endpoint handles tracks.
    setLoading(true);
    fetch(`/api/admin/mixes/${mix.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(()=>({error:'Failed'}))).error || 'Failed');
      // After metadata save, persist tracks if enabled
      if (tracklistEnabled) {
        const tracksPayload = tracks.filter(t => t.title.trim()).map((t, idx) => ({
          index: idx,
          title: t.title.trim(),
          artist: t.artist?.trim() || null,
          label: t.label?.trim() || null,
          timecodeSeconds: parseTimeToSeconds(t.time || '') || 0
        }));
        const res = await fetch(`/api/admin/mixes/${mix.id}/tracks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: tracksPayload })
        });
        if (!res.ok) {
          const j = await res.json().catch(()=>({error:'Failed'}));
          if (j.issues) {
            throw new Error(j.issues.slice(0,3).map((i:any)=>`Track ${i.index+1} ${i.field}: ${i.message}`).join('; '));
          }
            throw new Error(j.error || 'Failed to save tracks');
        } else {
          const j = await res.json().catch(()=>null);
          if (j && j.count !== undefined) {
            // optional: could show toast; using success flag already.
          }
        }
      }
      if (!tracklistEnabled) {
        // Clear tracks if disabled
        await fetch(`/api/admin/mixes/${mix.id}/tracks`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracks: [] }) });
      }
      setSuccess(true);
      router.refresh();
    }).catch(err => setError(err.message)).finally(()=>setLoading(false));
  }

  function handleDelete() {
    if (!confirm('Delete this mix? This cannot be undone.')) return;
    setDeleting(true); setError(null);
    fetch(`/api/admin/mixes/${mix.id}`, { method: 'DELETE' }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(()=>({error:'Failed'}))).error || 'Failed');
      router.push('/admin/mixes');
      router.refresh();
    }).catch(err => { setError(err.message); setDeleting(false); });
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30";
  const twoCol = "grid md:grid-cols-2 gap-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={twoCol}>
        <Field label="Number" name="number" defaultValue={mix.number} type="number" required />
        <Field label="Artist" name="artist" defaultValue={mix.artist} required />
        <Field label="Release Date" name="releaseDate" type="date" required defaultValue={toDateInput(mix.releaseDate)} />
        <Field label="Duration (seconds)" name="durationSeconds" type="number" defaultValue={mix.durationSeconds ?? ''} />
        <Field label="Location" name="location" defaultValue={mix.location || ''} />
        <Field label="Genre" name="genre" defaultValue={mix.genre || ''} />
        <Field label="BPM Low" name="bpmLow" type="number" defaultValue={mix.bpmLow ?? ''} />
        <Field label="BPM High" name="bpmHigh" type="number" defaultValue={mix.bpmHigh ?? ''} />
      </div>
      <div className={twoCol}>
        <Field label="Audio Path" name="audioPath" defaultValue={mix.audioPath || ''} />
        <Field label="Hero Image URL" name="heroImageUrl" defaultValue={mix.heroImageUrl || ''} />
        <Field label="Artwork URL" name="artworkUrl" defaultValue={mix.artworkUrl || ''} />
  <Field label="Tracklist URL" name="externalUrl" defaultValue={mix.externalUrl || ''} />
        <Field label="SoundCloud URL" name="soundcloudUrl" defaultValue={mix.soundcloudUrl || ''} />
        <Field label="Mixcloud URL" name="mixcloudUrl" defaultValue={mix.mixcloudUrl || ''} />
        <Field label="YouTube URL" name="youtubeUrl" defaultValue={mix.youtubeUrl || ''} />
        <Field label="Spotify URL" name="spotifyUrl" defaultValue={mix.spotifyUrl || ''} />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Bio</label>
        <textarea name="bio" rows={6} defaultValue={mix.bio || ''} className={fieldClass + ' resize-y'} />
      </div>
      <div className="pt-2 border-t border-white/10">
        <h2 className="text-sm font-medium mb-3">Tracklist</h2>
        <TracklistEditor
          initial={tracks}
          enabled={tracklistEnabled}
          onEnabledChange={setTracklistEnabled}
          onChange={setTracks}
        />
        {tracklistEnabled && <p className="mt-2 text-[10px] text-neutral-500">Track order saved exactly as listed. Leave time blank to default to 00:00.</p>}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Saved!</p>}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs px-4 py-2 rounded-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete Mix'}</button>
        <div className="flex items-center gap-3">
          <button type="reset" className="text-xs px-4 py-2 rounded-full border border-white/10 hover:border-white/30">Reset</button>
          <button disabled={loading} className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-accent-pink to-pink-500 text-white disabled:opacity-40">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </form>
  );
}

function Field(props: { label: string; name: string; type?: string; required?: boolean; defaultValue?: any }) {
  const { label, name, type='text', required, defaultValue } = props;
  return (
    <div className="space-y-1">
      <label className="block text-[10px] uppercase tracking-wider text-neutral-400">{label}{required && <span className="text-rose-400 ml-1">*</span>}</label>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30" />
    </div>
  );
}

function toDateInput(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0,10);
}

function secondsToTime(total: number) {
  if (!isFinite(total) || total < 0) return '';
  const h = Math.floor(total/3600); const m = Math.floor((total%3600)/60); const s = total%60;
  if (h>0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
