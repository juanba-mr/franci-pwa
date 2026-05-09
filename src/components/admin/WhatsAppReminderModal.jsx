const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { X, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function WhatsAppReminderModal({ cliente, poliza, onClose }) {
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);

  const generarMensaje = async () => {
    setLoading(true);
    const fecha = poliza.vigencia_hasta ? format(parseISO(poliza.vigencia_hasta), "d 'de' MMMM", { locale: es }) : 'próximamente';
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Redactá un mensaje de WhatsApp breve y cordial en español argentino (voseo) para recordarle a un cliente que su póliza de seguro está por vencer. 
Datos:
- Nombre del cliente: ${cliente.nombre}
- Tipo de seguro: ${poliza.tipo_seguro}
- Compañía: ${poliza.compania}
- Vencimiento: ${fecha}
- Número de póliza: ${poliza.numero_poliza}
Firma como "Hermes Asesores". El mensaje debe ser cálido, profesional y no mayor a 3 párrafos.`
    });
    setMensaje(result);
    setLoading(false);
  };

  useEffect(() => { generarMensaje(); }, []);

  const handleSend = () => {
    const tel = cliente.telefono?.replace(/\D/g, '');
    if (!tel) { toast.error('El cliente no tiene teléfono registrado'); return; }
    const url = `https://wa.me/54${tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <h2 className="font-semibold text-foreground text-sm">Mensaje de Renovación</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{cliente.nombre[0]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cliente.nombre}</p>
              <p className="text-xs text-muted-foreground">{cliente.telefono || 'Sin teléfono'}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Redactando con IA…</p>
            </div>
          ) : (
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={7}
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
        </div>

        <div className="flex items-center gap-2 px-5 pb-5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={generarMensaje} disabled={loading}>
            <RefreshCw className="w-3.5 h-3.5" /> Regenerar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleSend}
            disabled={loading || !mensaje}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}