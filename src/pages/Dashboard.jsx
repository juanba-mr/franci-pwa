const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PolicyCard from '@/components/dashboard/PolicyCard';
import EmergencySection from '@/components/dashboard/EmergencySection';
import MessageCard from '@/components/dashboard/MessageCard';
import WhatsAppFAB from '@/components/dashboard/WhatsAppFAB';

export default function Dashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');

  const { data: clientes, isLoading: loadingCliente } = useQuery({
    queryKey: ['cliente', dni],
    queryFn: () => db.entities.Cliente.filter({ dni }),
    enabled: !!dni,
  });

  const { data: mensajes, isLoading: loadingMensajes } = useQuery({
    queryKey: ['mensajes', dni],
    queryFn: () => db.entities.Mensaje.filter({ cliente_dni: dni }, '-created_date', 10),
    enabled: !!dni,
  });

  const cliente = clientes?.[0];
  const polizas = cliente?.polizas || [];

  if (loadingCliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-foreground">Cliente no encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Verificá tu DNI e intentá de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <DashboardHeader nombre={cliente.nombre} />

      {/* Pólizas Activas */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Mis Pólizas
          </h2>
          <span className="text-xs text-muted-foreground">
            {polizas.length} {polizas.length === 1 ? 'póliza' : 'pólizas'}
          </span>
        </div>

        {polizas.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tenés pólizas registradas</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-x-auto">
            {polizas.map((poliza, i) => (
              <PolicyCard key={i} poliza={poliza} index={i} dni={dni} />
            ))}
          </div>
        )}
      </div>

      {/* Auxilio Mecánico */}
      <EmergencySection polizas={polizas} />

      {/* Mensajes */}
      {mensajes && mensajes.length > 0 && (
        <div className="px-5 mb-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Notificaciones
          </h2>
          <div className="space-y-2.5">
            {mensajes.map((msg, i) => (
              <MessageCard key={msg.id} mensaje={msg} index={i} />
            ))}
          </div>
        </div>
      )}

      <WhatsAppFAB />
    </div>
  );
}