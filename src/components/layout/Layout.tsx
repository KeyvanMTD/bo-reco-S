import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useState } from 'react';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex flex-col min-h-screen transition-all transition-slow`}>
        <Topbar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}