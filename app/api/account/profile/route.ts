import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { isSuperAdminName } from '../../../../lib/auth';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name: string | undefined = body?.name?.trim();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (name.length > 60) return NextResponse.json({ error: 'Too long' }, { status: 400 });
  const s: any = session;
  const me = await prisma.user.findUnique({ where: { id: s.user.id } }) as any;
  if (isSuperAdminName(name) && !isSuperAdminName(me?.name)) {
    return NextResponse.json({ error: 'That username is reserved' }, { status: 403 });
  }
  await prisma.user.update({ where: { id: s.user.id }, data: { name } });
  return NextResponse.json({ ok: true });
}
