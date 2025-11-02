import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}

