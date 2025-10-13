import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const mixes = await prisma.mix.findMany({ orderBy: { releaseDate: 'desc' }, take: 6 });
  return Response.json({ items: mixes });
}
