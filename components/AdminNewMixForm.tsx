"use client";
import { useState } from 'react';
import { TracklistEditor, EditableTrackRow } from './TracklistEditor';

export function AdminNewMixForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);

  const [tracklistEnabled, setTracklistEnabled] = useState(false);
  const [tracks, setTracks] = useState<EditableTrackRow[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setSuccess(false);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    // augment with tracklist if enabled
    // Tracklist handled after creation via PUT endpoint. Don't send with POST payload to keep API strict.
    setLoading(true);
    fetch('/api/admin/mixes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(async r => {
      if (!r.ok) {
        const j = await r.json().catch(()=>({error:'Failed'}));
        throw new Error(j.error || 'Failed');
      }
      const resJson = await r.json();
      // Optionally post tracklist separately (already created in transaction but ensure updates formatting/time normalization)
      if (tracklistEnabled && tracks.length) {
        const tracksPayload = tracks.filter(t => t.title.trim()).map((t, idx) => ({
          index: idx,
          title: t.title.trim(),
          artist: t.artist?.trim() || null,
          label: t.label?.trim() || null,
          timecodeSeconds: (t.time && t.time.includes(':')) ? parseTimeGuess(t.time) : 0
        }));
        await fetch(`/api/admin/mixes/${resJson.mix.id}/tracks`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracks: tracksPayload }) });
      }
      setSuccess(true); form.reset(); setTracks([]); setTracklistEnabled(false);
    }).catch(err => setError(err.message)).finally(()=>setLoading(false));
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30";
  const twoCol = "grid md:grid-cols-2 gap-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={twoCol}>
        <Field label="Number" name="number" required placeholder="1234" />
        <Field label="Artist" name="artist" required placeholder="Artist Name" />
        <Field label="Release Date" name="releaseDate" type="date" required />
        <Field label="Duration (seconds)" name="durationSeconds" type="number" placeholder="7200" />
        <Field label="Location" name="location" placeholder="Space Ibiza" />
        <Field label="Genre" name="genre" placeholder="House" />
        <Field label="BPM Low" name="bpmLow" type="number" />
        <Field label="BPM High" name="bpmHigh" type="number" />
      </div>
      <div className={twoCol}>
        <Field label="Audio Path" name="audioPath" placeholder="/audio/mix1234.mp3" />
        <Field label="Hero Image URL" name="heroImageUrl" placeholder="https://..." />
        <Field label="Artwork URL" name="artworkUrl" placeholder="https://..." />
  <Field label="Tracklist URL" name="externalUrl" placeholder="https://www.1001tracklists.com/tracklist/..." />
        <Field label="SoundCloud URL" name="soundcloudUrl" placeholder="https://soundcloud.com/..." />
        <Field label="Mixcloud URL" name="mixcloudUrl" placeholder="https://www.mixcloud.com/..." />
        <Field label="YouTube URL" name="youtubeUrl" placeholder="https://youtube.com/watch?v=..." />
        <Field label="Spotify URL" name="spotifyUrl" placeholder="https://open.spotify.com/..." />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Bio</label>
        <textarea name="bio" rows={5} className={fieldClass + ' resize-y'} placeholder="Mix description / context..." />
      </div>
      <div className="pt-2 border-t border-white/10">
        <h2 className="text-sm font-medium mb-3">Tracklist</h2>
        <TracklistEditor
          initial={[]}
            enabled={tracklistEnabled}
            onEnabledChange={setTracklistEnabled}
            onChange={setTracks}
          />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Mix created!</p>}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="reset" className="text-xs px-4 py-2 rounded-full border border-white/10 hover:border-white/30">Reset</button>
        <button disabled={loading} className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-accent-pink to-pink-500 text-white disabled:opacity-40">{loading ? 'Creating...' : 'Create Mix'}</button>
      </div>
    </form>
  );
}

function Field(props: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  const { label, name, type='text', required, placeholder } = props;
  return (
    <div className="space-y-1">
      <label className="block text-[10px] uppercase tracking-wider text-neutral-400">{label}{required && <span className="text-rose-400 ml-1">*</span>}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30" />
    </div>
  );
}

function parseTimeGuess(val: string) {
  if (!val) return 0; const p = val.split(':').map(Number); if (p.some(isNaN)) return 0; if (p.length===2){return p[0]*60+p[1];} if(p.length===3){return p[0]*3600+p[1]*60+p[2];} return 0;
}
