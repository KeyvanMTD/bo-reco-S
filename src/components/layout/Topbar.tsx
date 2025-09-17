import { ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar() {
  return (
    <header className="h-16 sticky top-0 z-50 glass-card border-b border-sidebar-border flex items-center justify-between px-8 animate-fade-in">
      {/* Tenant Switcher Premium */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-primary border border-border hover:border-border-hover transition-premium hover:shadow-premium-sm group">
            <div className="w-7 h-7 bg-gradient-primary rounded-lg flex items-center justify-center shadow-premium-xs group-hover:scale-105 transition-premium">
              <span className="text-sm font-bold text-primary-foreground">LR</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-body-sm font-medium text-foreground">Test</span>
              <span className="text-caption text-muted-foreground">Production</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-fast" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 mt-2 border-premium shadow-premium-lg">
          <div className="p-3">
            <div className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Environnements
            </div>
            <DropdownMenuItem className="text-body-sm py-3 rounded-lg">
              <div className="flex items-center gap-3 w-full">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">LR</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">La Redoute</div>
                  <div className="text-caption text-muted-foreground">Production</div>
                </div>
                <div className="w-2 h-2 bg-success rounded-full shadow-success/25 shadow-lg" />
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu Premium */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-secondary transition-premium group">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-premium-xs group-hover:scale-105 transition-premium">
              <span className="text-sm font-bold text-primary-foreground">KV</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-body-sm font-medium text-foreground">Kevin</span>
              <span className="text-caption text-muted-foreground">Admin</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-fast" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 border-premium shadow-premium-lg">
          <div className="p-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-premium-sm">
                <span className="font-bold text-primary-foreground">KV</span>
              </div>
              <div>
                <div className="text-body-sm font-medium text-foreground">Kevin Vauquelin</div>
                <div className="text-caption text-muted-foreground">kevin@reco.ai</div>
              </div>
            </div>
            <div className="pt-2 space-y-1">
              <DropdownMenuItem className="text-body-sm py-2 rounded-lg transition-premium">
                <User className="w-4 h-4 mr-3" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-body-sm py-2 rounded-lg transition-premium">
                <div className="w-4 h-4 mr-3 rounded bg-muted" />
                Équipe
              </DropdownMenuItem>
              <DropdownMenuItem className="text-body-sm py-2 rounded-lg transition-premium text-error hover:bg-error-light">
                <div className="w-4 h-4 mr-3 rounded bg-error/20" />
                Déconnexion
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
