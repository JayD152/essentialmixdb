import { prisma } from '../../../../lib/prisma';

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
