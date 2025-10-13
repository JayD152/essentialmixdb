import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, status: 401, error: 'Unauthorized' } as const;
  if (!session.user?.isAdmin) return { ok: false, status: 403, error: 'Admin required' } as const;
  return { ok: true } as const;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const mixId = Number(params.id);
  if (!Number.isInteger(mixId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const tracks = await prisma.track.findMany({ where: { mixId }, orderBy: { index: 'asc' } });
  return NextResponse.json({ tracks });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const mixId = Number(params.id);
    if (!Number.isInteger(mixId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json();
    if (!Array.isArray(body.tracks)) return NextResponse.json({ error: 'tracks array required' }, { status: 400 });

    const MAX_TRACKS = 300;
    if (body.tracks.length > MAX_TRACKS) {
      return NextResponse.json({ error: `Too many tracks (max ${MAX_TRACKS})` }, { status: 400 });
    }

    const issues: { index: number; field: string; message: string }[] = [];
    const sanitized = body.tracks.map((t: any, idx: number) => {
      const title = typeof t.title === 'string' ? t.title.trim() : '';
      if (!title) issues.push({ index: idx, field: 'title', message: 'Title required' });
      let time = t.timecodeSeconds;
      if (typeof time !== 'number' || !isFinite(time)) time = 0;
      if (time < 0) { issues.push({ index: idx, field: 'timecodeSeconds', message: 'Cannot be negative' }); time = 0; }
      if (time > 8*3600) { issues.push({ index: idx, field: 'timecodeSeconds', message: 'Unrealistic (> 8h)' }); }
      const artist = t.artist ? String(t.artist).trim() : null;
      const label = t.label ? String(t.label).trim() : null;
      return {
        mixId,
        index: idx,
        timecodeSeconds: Math.max(0, Math.floor(time)),
        title: title.slice(0, 300) || 'Untitled',
        artist: artist ? artist.slice(0,200) : null,
        label: label ? label.slice(0,200) : null
      };
    });

    if (issues.length) {
      return NextResponse.json({ error: 'Validation failed', issues }, { status: 400 });
    }

    await prisma.$transaction(async tx => {
      await tx.track.deleteMany({ where: { mixId } });
      if (sanitized.length) {
        await tx.track.createMany({ data: sanitized });
      }
    });
    return NextResponse.json({ ok: true, count: sanitized.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
