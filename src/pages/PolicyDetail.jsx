import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Calendar, CreditCard, Phone,
  Download, FileText, Car, Home, Heart, Briefcase, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentStatusBadge from '@/components/dashboard/PaymentStatusBadge';
import VigenciaBadge from '@/components/dashboard/VigenciaBadge';
import WhatsAppFAB from '@/components/dashboard/WhatsAppFAB';

const tipoIcons = {
  'RCA': Car,
  'Todo Riesgo': Car,
  'Terceros Completo': Car,
  'Hogar': Home,
  'Vida': Heart,
  'AP Laboral': Briefcase,
};

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'S/D' || dateStr === '-') return '-';
  try {
    return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

export default function PolicyDetail() {
  const { index } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');

  // Hacemos el fetch a tu backend de FastAPI real
  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', dni],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clientes/${dni}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al traer los datos');
      return res.json();
    },
    enabled: !!dni,
  });

  // Buscamos la póliza correcta usando el índice que nos llega por la URL
  const poliza = cliente?.polizas?.[parseInt(index)];
  const Icon = tipoIcons[poliza?.tipo_seguro] || Shield;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!poliza) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <p className="text-foreground font-semibold">Póliza no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground text-sm">Detalle de Póliza</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-5 pt-5"
      >
        {/* Policy Header */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">{poliza.compania}</p>
              <p className="font-bold text-foreground text-lg mt-0.5">
                Póliza N° {poliza.numero_poliza}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <VigenciaBadge estado={poliza.estado} />
                <PaymentStatusBadge status={poliza.estado_pago} />
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoCard label="Tipo de Seguro" value={poliza.tipo_seguro} icon={Shield} />
          {poliza.vehiculo && <InfoCard label="Vehículo" value={poliza.vehiculo} icon={Car} />}
          {poliza.patente && <InfoCard label="Patente" value={poliza.patente} icon={FileText} />}
          <InfoCard label="Vigencia Hasta" value={formatDate(poliza.vigencia_hasta)} icon={Calendar} />

          {/* Si tuviéramos cuota y vencimiento en la DB, se mostrarían acá */}
          {poliza.cuota_actual && (
            <InfoCard label="Cuota Actual" value={`$${poliza.cuota_actual.toLocaleString()}`} icon={CreditCard} />
          )}
          {poliza.proximo_vencimiento && (
            <InfoCard label="Próx. Vencimiento" value={formatDate(poliza.proximo_vencimiento)} icon={Calendar} />
          )}
        </div>

        {/* Asistencia */}
        {poliza.asistencia_telefono && (
          <a
            href={`tel:${poliza.asistencia_telefono.replace(/\D/g, '')}`}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asistencia {poliza.compania}</p>
              <p className="font-bold text-foreground">{poliza.asistencia_telefono}</p>
            </div>
          </a>
        )}

        {/* Document Actions */}
        <div className="space-y-2.5">
          <button
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:bg-muted transition-colors"
            onClick={() => alert('Próximamente disponible')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">Descargar Carnet Digital</p>
              <p className="text-xs text-muted-foreground">Tu credencial de seguro</p>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:bg-muted transition-colors"
            onClick={() => alert('Próximamente disponible')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">Ver Cupones de Pago</p>
              <p className="text-xs text-muted-foreground">Consultá tus cuotas pendientes</p>
            </div>
          </button>
        </div>
      </motion.div>

      <WhatsAppFAB />
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col justify-center">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold text-foreground text-sm">{value || '-'}</p>
    </div>
  );
}