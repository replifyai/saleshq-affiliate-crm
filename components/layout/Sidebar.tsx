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
    <div className="flex flex-col h-screen w-64 bg-slate-950 text-white">
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <h3 className="text-xs font-bold tracking-tight">SalesHQ CRM</h3>
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
                'group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isActive
                  ? 'bg-blue-600/15 text-white border-l-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800">
        {admin && (
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 mr-3">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {admin.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {admin.email}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

