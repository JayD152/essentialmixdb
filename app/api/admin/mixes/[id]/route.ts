import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, status: 401, error: 'Unauthorized' } as const;
  if (!session.user?.isAdmin) return { ok: false, status: 403, error: 'Admin required' } as const;
  return { ok: true } as const;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json();
    const data: any = {};
    const numeric = ['number','durationSeconds','bpmLow','bpmHigh'] as const;
    for (const key of Object.keys(body)) {
      if (key === 'title') continue; // title deprecated
      const v = body[key];
      if (v === undefined) continue;
      if (numeric.includes(key as any)) {
        if (v === '' || v === null) data[key] = null; else data[key] = Number(v);
      } else if (key === 'releaseDate') {
        data.releaseDate = new Date(v);
      } else {
        data[key] = v === '' ? null : v;
      }
    }
    if (data.number) {
      const existing = await prisma.mix.findUnique({ where: { number: data.number } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Mix number already in use' }, { status: 409 });
      }
    }
    const updated = await prisma.mix.update({ where: { id }, data });
    return NextResponse.json({ mix: updated });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    await prisma.mix.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
