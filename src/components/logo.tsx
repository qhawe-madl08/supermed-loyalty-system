'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getHomeRoute } from '@/lib/navigation-helper';

interface LogoProps {
  currentRole?: 'owner' | 'admin' | 'manager' | 'cashier' | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ currentRole, size = 'md' }: LogoProps) {
  const router = useRouter();

  const handleClick = () => {
    const homeRoute = getHomeRoute(currentRole || null);
    router.push(homeRoute);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      onClick={handleClick}
      className="relative cursor-pointer"
      aria-label="Go to home"
    >
      <div className={sizeClasses[size]}>
        <Image
          src="/media/logo.png"
          alt="Supermed Pharmacy Logo"
          fill
          className="object-contain"
        />
      </div>
    </button>
  );
}
