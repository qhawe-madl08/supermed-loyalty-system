import Link from 'next/link';

export function UserMenu() {
  // Simplified user menu for server component
  // In production, this would use the actual authenticated user
  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">Staff User</p>
        <p className="text-xs text-gray-500">Branch Manager</p>
      </div>
      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
        S
      </div>
      <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
        Sign Out
      </Link>
    </div>
  );
}