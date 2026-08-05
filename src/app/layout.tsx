import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supermed Loyalty System',
  description: 'Enterprise customer loyalty management for Supermed Pharmacies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
