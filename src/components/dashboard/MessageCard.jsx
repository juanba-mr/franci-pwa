import React from 'react';
import { Bell, AlertTriangle, Info, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const tipoConfig = {
  vencimiento: { Icon: AlertTriangle, bgClass: 'bg-amber-500/10', iconClass: 'text-amber-500' },
  alerta: { Icon: AlertTriangle, bgClass: 'bg-red-500/10', iconClass: 'text-red-500' },
  info: { Icon: Info, bgClass: 'bg-primary/10', iconClass: 'text-primary' },
  promo: { Icon: Tag, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500' },
};

export default function MessageCard({ mensaje, index }) {
  const config = tipoConfig[mensaje.tipo] || tipoConfig.info;
  const { Icon } = config;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-card border border-border rounded-2xl p-4 flex gap-3"
    >
      <div className={`w-9 h-9 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground">{mensaje.titulo}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mensaje.contenido}</p>
      </div>
      {!mensaje.leido && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </motion.div>
  );
}