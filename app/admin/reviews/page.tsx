import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
// @ts-ignore - path resolution
import AdminReviewsTable from '../../../components/AdminReviewsTable';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');
  if (!session.user?.isAdmin) redirect('/auth');

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { mix: { select: { id: true, number: true, artist: true } } }
  });

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-neutral-500">Recent submitted reviews (latest 200). Delete any violating content.</p>
      </header>
      <AdminReviewsTable initialReviews={JSON.parse(JSON.stringify(reviews))} />
    </div>
  );
}
