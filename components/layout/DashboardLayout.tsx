import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-secondary">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-secondary">
        {children}
      </main>
    </div>
  );
}
