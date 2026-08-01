import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supermed Loyalty MVP',
  description: 'Simple staff workflow for loyalty cards and points.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
