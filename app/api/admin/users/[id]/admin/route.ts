import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isSuperAdminName } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s: any = session;
  if (!s.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(()=>({}));
  const admin = !!body.admin;
  const target = await prisma.user.findUnique({ where: { id: params.id } }) as any;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!admin && isSuperAdminName(target.name)) {
    return NextResponse.json({ error: 'Super admin cannot be demoted' }, { status: 400 });
  }
  await prisma.user.update({ where: { id: params.id }, data: { isAdmin: admin } }).catch(()=>{});
  return NextResponse.json({ ok: true, admin });
}
