import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, RefreshCw, Upload, Settings, Shield, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panel Principal', exact: true },
  { to: '/admin/clientes', icon: Users, label: 'Explorador de Clientes' },
  { to: '/admin/renovaciones', icon: RefreshCw, label: 'Renovaciones' },
  { to: '/admin/ingesta', icon: Upload, label: 'Centro de Ingesta' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración APIs' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm leading-tight">Hermes</p>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Ver app del cliente
        </Link>
      </div>
    </aside>
  );
}