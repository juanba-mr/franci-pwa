import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const estadoConfig = {
  vigente: { label: 'Vigente', Icon: CheckCircle, bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600' },
  por_vencer: { label: 'Por vencer', Icon: AlertTriangle, bgClass: 'bg-amber-500/10', textClass: 'text-amber-600' },
  vencida: { label: 'Vencida', Icon: XCircle, bgClass: 'bg-red-500/10', textClass: 'text-red-600' },
};

export default function VigenciaBadge({ estado }) {
  const config = estadoConfig[estado] || estadoConfig.vigente;
  const { Icon } = config;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}