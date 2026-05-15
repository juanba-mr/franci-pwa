import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, BellRing, X } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PolicyCard from '@/components/dashboard/PolicyCard';
import EmergencySection from '@/components/dashboard/EmergencySection';
import MessageCard from '@/components/dashboard/MessageCard';
import WhatsAppFAB from '@/components/dashboard/WhatsAppFAB';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BotonAyuda from '@/components/BotonAyuda';

export default function Dashboard() {
  const savedUser = JSON.parse(localStorage.getItem('hermes_user') || '{}');
  const dni = savedUser.dni;

  // Llamada REAL a tu base de datos Neon mediante FastAPI
  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['cliente', dni],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      // La URL ahora usa el dni que sacamos del localStorage 
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clientes/${dni}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al traer los datos');
      return res.json();
    },
    enabled: !!dni, // Solo se ejecuta si hay un DNI 
  });

  // 2. FUNCIÓN MÁGICA: Activar Notificaciones Push
  const activarNotificaciones = async () => {
    try {
      // Pedimos permiso al usuario
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permiso denegado para notificaciones.');
        return;
      }

      // 1. Leemos la llave y le podamos cualquier comilla o espacio que se haya colado
      // @ts-ignore (esto calla el error rojo de VS Code)
      let publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        toast.error("Falta la llave VAPID en el archivo .env del frontend.");
        console.error("VITE_VAPID_PUBLIC_KEY está undefined");
        return;
      }

      // Magia limpiadora: saca comillas al principio/final y espacios vacíos
      publicVapidKey = publicVapidKey.replace(/^["']|["']$/g, '').trim();

      // 2. Registramos el Service Worker y ESPERAMOS a que esté listo
      await navigator.serviceWorker.register('/sw.js');
      const swReady = await navigator.serviceWorker.ready;

      // 3. Conversión de llave VAPID
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // 4. Nos suscribimos usando el SW ya listo
      const subscription = await swReady.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // 5. Enviamos la suscripción al Backend
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/suscribir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dni: dni, suscripcion: subscription })
      });

      if (res.ok) {
        toast.success('¡Alertas activadas! Te avisaremos por acá.');
      } else {
        toast.error('Error al guardar la suscripción en el servidor.');
      }
    } catch (error) {
      console.error("Error completo:", error);
      toast.error('Hubo un error al activar las alertas.');
    }
  };

  // Por ahora dejamos los mensajes vacíos hasta conectar la IA
  const mensajes = [];
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
          <p className="text-sm text-muted-foreground mt-1">Hubo un problema al cargar tus datos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <DashboardHeader nombre={cliente.nombre} />

      {/* Banner de Notificaciones Inteligentes */}
      <div className="px-5 mb-6">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">¿Querés avisos de vencimiento?</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Activá las alertas para que te avisemos antes de que venza tu póliza.
              </p>
              <Button
                size="sm"
                onClick={activarNotificaciones}
                className="h-8 text-xs font-semibold px-4"
              >
                Activar Alertas
              </Button>
            </div>
          </div>
          {/* Decoración de fondo del banner */}
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        </div>
      </div>

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

      {/* Mensajes de IA (A futuro) */}
      {mensajes.length > 0 && (
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

      {/* Agregá el botón al final, justo antes de WhatsAppFAB */}
      <BotonAyuda contexto="dashboard" />

      <WhatsAppFAB />
    </div>
  );
}