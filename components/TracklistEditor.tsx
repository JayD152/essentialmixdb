"use client";
import { useState, useEffect } from 'react';

export interface EditableTrackRow {
  id?: number;
  title: string;
  artist?: string;
  label?: string;
  time?: string; // mm:ss or hh:mm:ss
}

interface Props {
  initial?: EditableTrackRow[];
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  onChange: (tracks: EditableTrackRow[]) => void;
  compact?: boolean;
}

export function TracklistEditor({ initial = [], enabled, onEnabledChange, onChange, compact }: Props) {
  const [tracks, setTracks] = useState<EditableTrackRow[]>(initial);
  // If initial prop arrives after mount (e.g., async fetch) and we haven't populated yet, hydrate once.
  useEffect(() => {
    if (initial.length && tracks.length === 0) setTracks(initial);
  }, [initial, tracks.length]);

  useEffect(() => { onChange(tracks); }, [tracks, onChange]);

  function addRow() {
    setTracks(t => {
      if (t.length >= 300) return t; // enforce client max mirror
      return [...t, { title: '', time: formatTimeGuess(nextTimeGuess(t)), artist: '', label: '' }];
    });
  }
  function update(i: number, patch: Partial<EditableTrackRow>) {
    setTracks(t => t.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  }
  function remove(i: number) { setTracks(t => t.filter((_, idx) => idx !== i)); }
  function clearAll() { if (confirm('Clear all tracks?')) setTracks([]); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-pink-500" checked={enabled} onChange={e => onEnabledChange(e.target.checked)} />
          <span>Enable Tracklist</span>
        </label>
        {enabled && (
          <>
            <button type="button" onClick={addRow} className="text-xs px-3 py-1 rounded-full border border-white/15 hover:border-white/35 bg-white/5">Add Track</button>
            {tracks.length > 0 && <button type="button" onClick={clearAll} className="text-xs px-3 py-1 rounded-full border border-rose-500/30 text-rose-300 hover:bg-rose-500/10">Clear</button>}
            <span className="text-xs text-neutral-500">{tracks.length} tracks</span>
          </>
        )}
      </div>
      {enabled && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-neutral-400 bg-white/5">
              <tr>
                <Th>#</Th>
                <Th>Time</Th>
                <Th>Title</Th>
                <Th>Artist</Th>
                <Th>Label</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {tracks.map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <Td className="font-mono text-neutral-500 w-8">{String(i+1).padStart(2,'0')}</Td>
                  <Td className="w-24">
                    <input
                      value={row.time || ''}
                      onChange={e => update(i, { time: e.target.value })}
                      placeholder="00:00"
                      className="w-full bg-transparent border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </Td>
                  <Td>
                    <input
                      value={row.title}
                      onChange={e => update(i, { title: e.target.value })}
                      placeholder="Track title"
                      required
                      className="w-full bg-transparent border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </Td>
                  <Td>
                    <input
                      value={row.artist || ''}
                      onChange={e => update(i, { artist: e.target.value })}
                      placeholder="Artist"
                      className="w-full bg-transparent border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </Td>
                  <Td>
                    <input
                      value={row.label || ''}
                      onChange={e => update(i, { label: e.target.value })}
                      placeholder="Label"
                      className="w-full bg-transparent border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </Td>
                  <Td className="w-12 text-right">
                    <button type="button" onClick={() => remove(i)} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-white/30">✕</button>
                  </Td>
                </tr>
              ))}
              {tracks.length === 0 && (
                <tr>
                  <Td colSpan={6} className="text-center py-6 text-neutral-500">No tracks yet. Click Add Track.</Td>
                </tr>
              )}
            </tbody>
          </table>
          {tracks.length >= 300 && <div className="p-2 text-[10px] text-rose-400 bg-rose-500/10 border-t border-rose-500/30">Maximum of 300 tracks reached.</div>}
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left font-medium py-2 px-3 first:pl-4">{children}</th>; }
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) { return <td colSpan={colSpan} className={`py-2 px-3 first:pl-4 align-top ${className}`}>{children}</td>; }

// Utility: parse existing tracks to guess next time for convenience
function nextTimeGuess(rows: EditableTrackRow[]) {
  if (!rows.length) return 0;
  const last = rows[rows.length - 1];
  const sec = parseTimeToSeconds(last.time || '');
  if (!isFinite(sec)) return 0;
  return sec + 180; // assume average 3 min
}

function formatTimeGuess(total: number) {
  if (!isFinite(total) || total <= 0) return ''; const h = Math.floor(total/3600); const m = Math.floor((total%3600)/60); const s = total%60; if (h>0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export function parseTimeToSeconds(val: string): number {
  if (!val) return NaN;
  const parts = val.split(':').map(p => p.trim()).filter(Boolean).map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 2) { const [m,s]=parts; return m*60+s; }
  if (parts.length === 3) { const [h,m,s]=parts; return h*3600+m*60+s; }
  return NaN;
}
