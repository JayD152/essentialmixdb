import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const mixes = await prisma.mix.findMany({ orderBy: { releaseDate: 'desc' }, take: 6 });
  return Response.json({ items: mixes });
}
