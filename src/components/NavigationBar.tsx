"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: '🏠'
  },
  {
    href: '/trips/history',
    label: 'Trips',
    icon: '📍'
  },
  {
    href: '/travelers',
    label: 'Travelers',
    icon: '👥'
  },
  {
    href: '/consent',
    label: 'Privacy',
    icon: '🔒'
  }
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}