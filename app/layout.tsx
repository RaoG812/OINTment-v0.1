import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'PM Control Suite',
  description: 'Integration matrix prototype',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-200">{children}</body>
    </html>
  );
}
