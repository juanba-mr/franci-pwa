import React from 'react';
import { cn } from '@/lib/utils';

export default function MetricCard({ title, value, sub, icon: Icon, trend, colorClass = 'text-primary', bgClass = 'bg-primary/10' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bgClass)}>
        <Icon className={cn('w-4 h-4', colorClass)} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
      {trend && (
        <p className={cn('text-xs font-medium mt-3', trend.positive ? 'text-emerald-600' : 'text-amber-600')}>
          {trend.label}
        </p>
      )}
    </div>
  );
}