import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(_req: Request, { params }: { params: { mixId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  const mixId = parseInt(params.mixId, 10);
  await prisma.libraryEntry.delete({ where: { userId: session.user.id, mixId } as any }).catch(() => {});
  return new Response('OK');
}
