import { NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 24;
  const where = search ? {
    OR: [
      { artist: { contains: search, mode: 'insensitive' } },
      { number: isNaN(Number(search)) ? undefined : Number(search) }
    ].filter(Boolean) as any
  } : {};

  const [items, total] = await Promise.all([
    prisma.mix.findMany({
      where,
      orderBy: { number: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.mix.count({ where })
  ]);

  return Response.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
}
