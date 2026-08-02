import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'Supermed Loyalty System',
  description: 'Enterprise customer loyalty management for Supermed Pharmacies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
