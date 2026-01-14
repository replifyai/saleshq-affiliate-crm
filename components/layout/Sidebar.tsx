'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  ShoppingCart,
  Wallet,
  LogOut,
  Layers,
} from 'lucide-react';

const navigation = [
  { name: 'Analytics', href: '/dashboard', icon: BarChart3 },
  { name: 'Affiliates', href: '/dashboard/creators', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Collections', href: '/dashboard/collections', icon: Layers },
  { name: 'Payouts', href: '/dashboard/payouts', icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen w-56 bg-[#FAFAFA] border-r border-gray-200">
      {/* Logo area */}
      <div className="flex items-center h-16 px-6">
        <Image
          src="/Logo.png"
          alt="Logo"
          width={80}
          height={32}
          className="object-contain"
          priority
        />
      </div>
      
      <nav className="flex-1 px-3 py-2 space-y-1">
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
                'group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[#EBEBEB] text-gray-900'
                  : 'text-gray-600 hover:bg-[#EBEBEB] hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-[#EBEBEB] hover:text-gray-900 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-500" />
          Logout
        </button>
      </div>
    </div>
  );
}
