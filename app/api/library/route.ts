import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const entries = await prisma.libraryEntry.findMany({ where: { userId: session.user.id }, include: { mix: true } });
  return Response.json({ items: entries });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { mixId } = await req.json();
  const entry = await prisma.libraryEntry.upsert({
    where: { userId_mixId: { userId: session.user.id, mixId } },
    update: {},
    create: { userId: session.user.id, mixId }
  });
  return Response.json(entry);
}
