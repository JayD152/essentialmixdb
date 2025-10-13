import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const mixes = await prisma.mix.findMany({
    where: { recommended: { isNot: null } },
    include: { recommended: true },
    orderBy: [
      { recommended: { priority: 'desc' } },
      { releaseDate: 'desc' }
    ],
    take: 16
  });
  return Response.json({ items: mixes });
}
