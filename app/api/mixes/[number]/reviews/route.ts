import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

// POST /api/mixes/[number]/reviews
export async function POST(req: Request, { params }: { params: { number: string } }) {
  try {
    const mixNumber = parseInt(params.number, 10);
    if (isNaN(mixNumber)) return NextResponse.json({ error: 'Invalid mix number' }, { status: 400 });
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { rating, text } = body || {};
  const s: any = session;
  // fetch user to check ban status
  const dbUser = await prisma.user.findUnique({ where: { id: s.user?.id } });
  const u: any = dbUser;
  if (u?.isBanned) return NextResponse.json({ error: 'User banned' }, { status: 403 });
  const userName = dbUser?.name || s.user?.name || 'User';
    const intRating = parseInt(rating, 10);
    if (isNaN(intRating) || intRating < 1 || intRating > 5) return NextResponse.json({ error: 'rating 1-5 required' }, { status: 400 });
    if (!text || typeof text !== 'string' || text.length < 3) return NextResponse.json({ error: 'text too short' }, { status: 400 });

    const mix = await prisma.mix.findFirst({ where: { number: mixNumber }, select: { id: true, rating: true, ratingCount: true } });
    if (!mix) return NextResponse.json({ error: 'Mix not found' }, { status: 404 });

  // Optional: one review per user per mix (if needed). For now allow multiples unless we add userId column to Review.
  const review = await (prisma as any).review.create({ data: { mixId: mix.id, userName, rating: intRating, body: text, userId: dbUser?.id } });

    // Recompute aggregate rating
    const stats = await prisma.review.aggregate({ where: { mixId: mix.id }, _avg: { rating: true }, _count: { rating: true } });
    await prisma.mix.update({ where: { id: mix.id }, data: { rating: stats._avg.rating || 0, ratingCount: stats._count.rating } });

    return NextResponse.json({ review });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}