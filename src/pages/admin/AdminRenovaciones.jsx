import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, MessageCircle, Loader2, AlertCircle, BellRing, User, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentStatusBadge from '@/components/dashboard/PaymentStatusBadge';
import VigenciaBadge from '@/components/dashboard/VigenciaBadge';

export default function AdminRenovaciones() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);

  const { data: renovaciones = [], isLoading } = useQuery({
    queryKey: ['admin-renovaciones'],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/renovaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al cargar renovaciones');
      return res.json();
    }
  });

  const filtered = renovaciones.filter(r =>
    r.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    r.cliente_dni.includes(search) ||
    r.patente.toLowerCase().includes(search.toLowerCase())
  );

  const handleWhatsApp = (e, r) => {
    e.stopPropagation();
    if (!r.cliente_tel || r.cliente_tel.trim() === '') {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }

    let primerTelefono = r.cliente_tel.split(/[/,]|\s+-\s+/)[0];
    let numero = primerTelefono.replace(/\D/g, '');

    if (!numero) {
      alert("El número de teléfono guardado no es válido.");
      return;
    }

    if (numero.startsWith('54')) {
      if (!numero.startsWith('549')) {
        numero = '549' + numero.substring(2);
      }
    } else {
      if (numero.startsWith('0')) numero = numero.substring(1);
      if (numero.startsWith('15')) {
        numero = '9' + numero.substring(2);
      } else if (!numero.startsWith('9')) {
        numero = '9' + numero;
      }
      numero = '54' + numero;
    }

    const msg = `Hola ${r.cliente_nombre.split(' ')[0]}, te hablo de Franci Seguros. Te recordamos que tu póliza ${r.numero_poliza} (${r.vehiculo}) vence el ${format(parseISO(r.vence_el), 'dd/MM')}. ¿Querés que la renovemos?`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const dispararAlertaPush = async (e, poliza) => {
    e.stopPropagation();
    const idReal = poliza.id || poliza.id_poliza;

    if (!idReal) {
      console.error("Datos de la póliza donde falta el ID:", poliza);
      toast.error('No se encontró el ID de la póliza para enviar la alerta.');
      return;
    }

    const loadingToast = toast.loading('Gemini está redactando y enviando el mensaje...');

    try {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/disparar-alerta/${idReal}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(
          <div>
            <p className="font-bold">¡Mensaje enviado al celular!</p>
            <p className="text-xs italic mt-1">"{data.texto_generado}"</p>
          </div>
        );
      } else {
        toast.error(`No se pudo enviar el Push: ${data.mensaje}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Hubo un error al conectar con el servidor.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Próximas Renovaciones</h1>
        <p className="text-sm text-muted-foreground">Pólizas con vencimiento en los próximos 30 días.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No hay renovaciones pendientes para este mes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedCliente(selectedCliente?.cliente_dni === r.cliente_dni ? null : r)}
                className={`bg-card border rounded-2xl p-5 cursor-pointer transition-all shadow-sm ${selectedCliente?.cliente_dni === r.cliente_dni ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/30'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${r.dias_restantes <= 7 ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm sm:text-base">{r.cliente_nombre}</p>
                        <Badge variant={r.dias_restantes <= 7 ? "destructive" : "secondary"} className="text-[10px] px-1.5 h-5">
                          {r.dias_restantes} días
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground uppercase mt-0.5">{r.compania} · {r.vehiculo} {r.patente && `(${r.patente})`}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">
                        Vence el {format(parseISO(r.vence_el), "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    <Button size="sm" className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => handleWhatsApp(e, r)}>
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>
                    <button
                      onClick={(e) => dispararAlertaPush(e, r)}
                      className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                      title="Enviar Alerta Inteligente"
                    >
                      <BellRing className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="block lg:hidden">
                  {selectedCliente?.cliente_dni === r.cliente_dni && (
                    <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <ClienteDetail cliente={selectedCliente} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block bg-card border border-border rounded-2xl p-5 h-fit sticky top-6">
            {selectedCliente ? (
              <ClienteDetail cliente={selectedCliente} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <User className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Seleccioná una tarjeta para ver el perfil del cliente</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClienteDetail({ cliente }) {
  const dniBusqueda = cliente.cliente_dni || cliente.dni;

  const { data: clienteCompleto, isLoading } = useQuery({
    queryKey: ['cliente-detalle-renov', dniBusqueda],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clientes/${dniBusqueda}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al cargar detalle');
      return res.json();
    },
    enabled: !!dniBusqueda
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const nombre = cliente.cliente_nombre || cliente.nombre;
  const telefono = cliente.cliente_tel || cliente.telefono;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{nombre}</p>
          <p className="text-xs text-muted-foreground font-mono">DNI {dniBusqueda}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {telefono && (
          <a href={`tel:${telefono}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Phone className="w-3 h-3" /> {telefono}
          </a>
        )}
        {clienteCompleto?.email && (
          <a href={`mailto:${clienteCompleto.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Mail className="w-3 h-3" /> {clienteCompleto.email}
          </a>
        )}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Todas sus Pólizas</p>
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {(!clienteCompleto?.polizas || clienteCompleto.polizas.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-2">No hay pólizas registradas</p>
        ) : (
          clienteCompleto.polizas.map((p, i) => (
            <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-foreground">{p.tipo_seguro}</p>
                <VigenciaBadge estado={p.estado} />
              </div>
              <p className="text-xs text-muted-foreground">{p.compania} · {p.numero_poliza}</p>
              {p.vehiculo && <p className="text-xs text-muted-foreground mt-0.5">{p.vehiculo}</p>}
              <div className="mt-1.5">
                <PaymentStatusBadge status={p.estado_pago} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}