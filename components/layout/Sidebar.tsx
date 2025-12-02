'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Ticket,
  LogOut,
  User,
  ShoppingCart,
  Layers,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Creators', href: '/dashboard/creators', icon: Users },
  { name: 'Coupons', href: '/dashboard/coupons', icon: Ticket },
  { name: 'Collections', href: '/dashboard/collections', icon: Layers },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { admin, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-border">
      {/* Logo area with brand gradient */}
      <div className="flex items-center h-16 px-6 bg-brand-gradient border-b border-border-brand">
        <h3 className="text-sm font-bold tracking-tight text-foreground">SalesHQ CRM</h3>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isRootDashboard = item.href === '/dashboard';
          const isActive =
            mounted && (
              isRootDashboard
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')
            );
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-[#231F20]',
                isActive
                  ? 'bg-primary border border-border-brand'
                  : 'hover:bg-secondary hover:border hover:border-border'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-[#231F20]' : 'text-[#231F20] group-hover:text-foreground'
                )}
              />
              <span className="truncate text-[#231F20]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border">
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-secondary hover:border hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <LogOut className="mr-3 h-5 w-5 text-muted" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
