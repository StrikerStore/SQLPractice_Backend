import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQL CAT Trainer',
  description: 'Adaptive SQL practice with CAT-style progression.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
