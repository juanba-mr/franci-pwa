import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, RefreshCw, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panel', exact: true },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/renovaciones', icon: RefreshCw, label: 'Renov.' },
  { to: '/admin/ingesta', icon: Upload, label: 'Ingesta' },
  { to: '/admin/configuracion', icon: Settings, label: 'Config.' },
];

export default function AdminBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch h-16 safe-bottom">
      {navItems.map(({ to, icon: Icon, label, exact }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('w-5 h-5', active && 'text-primary')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}