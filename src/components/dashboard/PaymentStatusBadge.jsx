import React from 'react';

const statusConfig = {
  al_dia: { label: 'Al día', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-700' },
  por_vencer: { label: 'Por vencer', dotClass: 'bg-amber-500', bgClass: 'bg-amber-500/10', textClass: 'text-amber-700' },
  vencido: { label: 'Vencido', dotClass: 'bg-red-500', bgClass: 'bg-red-500/10', textClass: 'text-red-700' },
};

export default function PaymentStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.al_dia;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}