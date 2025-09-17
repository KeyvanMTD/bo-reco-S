import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Database, 
  Eye, 
  Settings,
  Zap,
  Activity,
  ListChecks,
  FileInput
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Catalog', href: '/catalog', icon: Package },
  { name: 'Mappings', href: '/mappings', icon: ArrowRightLeft },
  { name: 'Importer', href: '/ingestions', icon: FileInput },
  { name: 'Preview', href: '/preview', icon: Eye },
  { name: 'Performance', href: '/performance', icon: Activity },
  { name: 'Rules', href: '/rules', icon: ListChecks },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  return (
    <div 
      className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-gradient-subtle border-r border-sidebar-border flex flex-col transition-all transition-slow backdrop-blur-premium shadow-premium-sm fixed left-0 top-0 z-40`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-premium-sm transition-premium hover:scale-105">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-h2 text-sidebar-active-foreground tracking-tight">
              RecoAI
            </span>
          )}
        </div>
        <button 
          aria-label="Collapse sidebar"
          className="w-8 h-8 rounded-lg border border-sidebar-border bg-surface-primary text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active transition-premium hover:shadow-premium-sm" 
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="text-lg font-medium">
            {collapsed ? '›' : '‹'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            placeholder="Rechercher..."
            className={`input-premium ${collapsed ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'h-10'} transition-all transition-slow placeholder:text-muted-foreground`}
          />
        </div>
        
        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `nav-item ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} transition-premium`} />
              {!collapsed && (
                <span className="text-body-sm font-medium tracking-tight">
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto border-t border-sidebar-border p-3 space-y-2 bg-surface-tertiary/50">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `nav-item ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 ${
              isActive ? 'active' : ''
            }`
          }
        >
          <Settings className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && (
            <span className="text-body-sm font-medium">Settings</span>
          )}
        </NavLink>
        
        <button className={`nav-item ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 w-full`}>
          <div className={`w-7 h-7 rounded-lg bg-gradient-primary shadow-premium-xs ${collapsed ? '' : 'mr-3'} flex items-center justify-center`}>
            <span className="text-xs font-bold text-primary-foreground">KV</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start">
              <span className="text-body-sm font-medium text-sidebar-active-foreground">Profil</span>
              <span className="text-caption text-muted-foreground">kevin@reco.ai</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}