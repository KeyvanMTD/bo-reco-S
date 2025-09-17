import React from 'react';
import { Button } from '@/components/ui/button';

type HeroAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
};

export function Hero({
  title,
  subtitle,
  actions = [],
  rightSlot,
  variant = 'default',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: HeroAction[];
  rightSlot?: React.ReactNode;
  variant?: 'default' | 'catalog' | 'preview' | 'ingestions' | 'runs' | 'performance';
}) {
  
  const themeByVariant: Record<string, { gradient: string; accent: string; orb1: string; orb2: string }> = {
    default: { 
      gradient: 'bg-gradient-to-br from-primary/8 via-primary/4 to-transparent',
      accent: 'bg-primary/10',
      orb1: 'bg-primary/15',
      orb2: 'bg-primary/10'
    },
    catalog: { 
      gradient: 'bg-gradient-to-br from-violet-500/8 via-violet-500/4 to-transparent',
      accent: 'bg-violet-500/10',
      orb1: 'bg-violet-500/15',
      orb2: 'bg-violet-500/10'
    },
    preview: { 
      gradient: 'bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent',
      accent: 'bg-emerald-500/10',
      orb1: 'bg-emerald-500/15',
      orb2: 'bg-emerald-500/10'
    },
    ingestions: { 
      gradient: 'bg-gradient-to-br from-orange-500/8 via-orange-500/4 to-transparent',
      accent: 'bg-orange-500/10',
      orb1: 'bg-orange-500/15',
      orb2: 'bg-orange-500/10'
    },
    runs: { 
      gradient: 'bg-gradient-to-br from-orange-500/8 via-orange-500/4 to-transparent',
      accent: 'bg-orange-500/10',
      orb1: 'bg-orange-500/15',
      orb2: 'bg-orange-500/10'
    },
    performance: { 
      gradient: 'bg-gradient-to-br from-purple-500/8 via-purple-500/4 to-transparent',
      accent: 'bg-purple-500/10',
      orb1: 'bg-purple-500/15',
      orb2: 'bg-purple-500/10'
    },
  };

  const theme = themeByVariant[variant] || themeByVariant.default;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl ${theme.gradient} border border-border shadow-premium-sm backdrop-blur-premium animate-fade-in`}>
      {/* Premium Background Effects */}
      <div className={`pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full ${theme.orb1} blur-3xl opacity-50`} />
      <div className={`pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full ${theme.orb2} blur-3xl opacity-40`} />
      <div className="pointer-events-none absolute top-8 right-8 h-32 w-32 rounded-full bg-gradient-to-r from-surface-primary/30 to-transparent blur-2xl" />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-primary/60 to-surface-primary/30 backdrop-blur-sm" />

      <div className="relative p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-3xl animate-slide-up">
            <h1 className="text-display-md lg:text-display-lg font-display text-foreground tracking-tight mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-body-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                {subtitle}
              </p>
            )}
            {actions.length > 0 && (
              <div className="flex gap-4 flex-wrap">
                {actions.map((action, i) => (
                  action.href ? (
                    <a 
                      key={i} 
                      href={action.href} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-block animate-fade-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <button className={`btn-premium ${action.variant === 'outline' ? 'btn-secondary' : 'btn-primary'}`}>
                        {action.label}
                      </button>
                    </a>
                  ) : (
                    <button 
                      key={i} 
                      className={`btn-premium ${action.variant === 'outline' ? 'btn-secondary' : 'btn-primary'} animate-fade-in`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
          {rightSlot && (
            <div className="shrink-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;


