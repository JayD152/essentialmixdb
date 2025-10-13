import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // method override via form _method=DELETE
  const formData = await req.formData().catch(() => null);
  const method = formData?.get('_method');
  if (method === 'DELETE') return DELETE(req, { params });
  return NextResponse.json({ error: 'Unsupported' }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s: any = session;
  if (!s.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await prisma.review.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
