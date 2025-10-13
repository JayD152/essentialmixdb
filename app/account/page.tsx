import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import AccountClient from './client';

export default async function AccountPage() {
  const session = await getServerSession(authOptions as any);
  if (!session) redirect('/auth?callbackUrl=/account');

  const s: any = session;
  const user = await prisma.user.findUnique({ where: { id: s.user.id }, include: { library: true } });
  return (
    <div className="max-w-3xl mx-auto pt-10 pb-20 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your Account</h1>
        <p className="text-sm text-neutral-400">Manage profile details and view your stats.</p>
      </header>
      <AccountClient user={{ id: user!.id, name: user!.name }} stats={{ libraryCount: user!.library.length }} />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Library Summary</h2>
        <div className="text-sm text-neutral-300">You have <span className="text-white font-medium">{user!.library.length}</span> mixes saved.</div>
      </section>
    </div>
  );
}
