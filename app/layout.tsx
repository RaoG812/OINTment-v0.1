// @ts-nocheck
import './globals.css';
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import TopNav from '../components/TopNav';


export const metadata = {
  title: 'OINTment',
  description: 'Onboarding Insights Neural Toolset',
  icons: { icon: '/favicon.svg' }

};

export default function RootLayout({ children }: { children: ReactNode }) {
  const isLoggedIn = cookies().has('github_token');
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-200">
        <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-20">
          <TopNav isLoggedIn={isLoggedIn} />
        </header>
        {children}
      </body>

    </html>
  );
}
