import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import Providers from '../components/Providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { AccountMenu } from '../components/AccountMenu';

export const metadata = {
  title: 'Essential Mix DB',
  description: 'Every Essential Mix ever - searchable library and personal collection.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions as any) as any;
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header className="backdrop-blur bg-neutral-900/70 border-b border-neutral-800 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
                <nav className="flex items-center gap-5 text-sm text-neutral-300">
                  <Link className="hover:text-white" href="/mixes">Mixes</Link>
                  <Link className="hover:text-white" href="/artists">Artists</Link>
                  <Link className="hover:text-white" href="/library">Library</Link>
                  <Link className="hover:text-white" href="/about">About</Link>
                </nav>
                <div className="flex justify-center">
                  <Link
                    href="/"
                    className="site-title text-xl font-semibold tracking-tight bg-clip-text text-transparent"
                  >
                    Essential Mix DB
                  </Link>
                </div>
                <div className="flex justify-end text-xs text-neutral-400 items-center gap-4">
                  {session?.user?.isAdmin && (
                    <Link
                      href="/admin"
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full border border-pink-500/40 text-pink-300 hover:text-white hover:border-pink-400/70 hover:bg-pink-500/10 transition text-[11px] tracking-wide font-medium"
                      title="Admin Dashboard"
                    >
                      Admin
                    </Link>
                  )}
                  {session ? (
                    <AccountMenu initial={(session as any)?.user?.name?.slice(0,1)?.toUpperCase() || 'U'} isAdmin={!!session.user?.isAdmin} />
                  ) : (
                    <Link href="/auth" className="hover:text-white font-medium">Sign In</Link>
                  )}
                </div>
              </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
              {children}
            </main>
            <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
              © {new Date().getFullYear()} Essential Mix DB • Not affiliated with BBC Radio 1 • Made with
              <span className="inline-block mx-1 text-pink-400" aria-hidden="true">❤</span>
              <span aria-hidden="false" style={{ display: 'none' }}>Love</span>
              by <a className="text-neutral-300" href='https://www.youtube.com/watch?v=twwssm4KwO0' >Jay Dip</a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
