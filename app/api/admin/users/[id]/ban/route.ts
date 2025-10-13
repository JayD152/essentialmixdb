import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s: any = session;
  if (!s.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(()=>({}));
  const banned = !!body.banned;
  const id = params.id;
  await (prisma as any).user.update({ where: { id }, data: { isBanned: banned } }).catch(()=>{});
  return NextResponse.json({ ok: true, banned });
}
