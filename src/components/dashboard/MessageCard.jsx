import React from 'react';
import { Bell, AlertTriangle, Info, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const tipoConfig = {
  vencimiento: { Icon: AlertTriangle, bgClass: 'bg-amber-500/10', iconClass: 'text-amber-500' },
  alerta: { Icon: AlertTriangle, bgClass: 'bg-red-500/10', iconClass: 'text-red-500' },
  info: { Icon: Info, bgClass: 'bg-primary/10', iconClass: 'text-primary' },
  promo: { Icon: Tag, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500' },
};

export default function MessageCard({ mensaje, index }) {
  // Como el backend no manda 'tipo' todavía, va a caer siempre en 'info' por defecto.
  const config = tipoConfig[mensaje.tipo] || tipoConfig.info;
  const { Icon } = config;
  const queryClient = useQueryClient();

  // Muta el estado en la base de datos
  const marcarComoLeido = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mensajes/${mensaje.id}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al actualizar mensaje en la base de datos');
      return res.json();
    },
    onSuccess: () => {
      // Magia de React Query: Le avisamos que los datos del cliente quedaron viejos.
      // Al invalidar la query, hace un fetch de fondo y apaga el puntito sin recargar la página.
      const savedUser = JSON.parse(localStorage.getItem('hermes_user') || '{}');
      if (savedUser.dni) {
        queryClient.invalidateQueries({ queryKey: ['cliente', savedUser.dni] });
      }
    }
  });

  // Handler para el clic
  const handleCardClick = () => {
    // Si el mensaje NO está leído y no estamos en medio de una petición HTTP, disparamos
    if (!mensaje.leido && !marcarComoLeido.isPending) {
      marcarComoLeido.mutate();
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      // Si no está leído, le agregamos cursor pointer y un hover para que el usuario sepa que es clickeable
      className={`bg-card border border-border rounded-2xl p-4 flex gap-3 ${!mensaje.leido ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className={`w-9 h-9 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground">{mensaje.titulo}</p>
        {/* Cambiado de contenido a cuerpo para respetar el contrato del backend */}
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mensaje.cuerpo}</p>
      </div>
      {!mensaje.leido && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
      )}
    </motion.div>
  );
}