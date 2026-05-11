import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, MessageCircle, Eye, Loader2, AlertCircle, BellRing } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminRenovaciones() {
  const [search, setSearch] = useState('');

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

  const handleWhatsApp = (r) => {
    if (!r.cliente_tel || r.cliente_tel.trim() === '') {
      alert("Este cliente no tiene un número de teléfono registrado.");
      return;
    }

    // 1. Cortamos usando: barra (/), coma (,), o un guion que tenga espacios a los lados (" - ")
    // Esto evita cortar el número que tiene un guion pegado como "264-404"
    let primerTelefono = r.cliente_tel.split(/[/,]|\s+-\s+/)[0];

    // 2. Limpiamos: dejamos solo los números
    // Ej: "(54)264-4049716" -> "542644049716"
    let numero = primerTelefono.replace(/\D/g, '');

    if (!numero) {
      alert("El número de teléfono guardado no es válido.");
      return;
    }

    // 3. Lógica inteligente para Argentina y WhatsApp
    if (numero.startsWith('54')) {
      // Si empieza con 54 pero no tiene el 9 de celular, se lo inyectamos
      // Ej: 54 264 4049716 -> 54 9 264 4049716
      if (!numero.startsWith('549')) {
        numero = '549' + numero.substring(2);
      }
    } else {
      // Si lo guardaron sin el 54 (ej: 0264404...)
      if (numero.startsWith('0')) numero = numero.substring(1);

      if (numero.startsWith('15')) {
        numero = '9' + numero.substring(2);
      } else if (!numero.startsWith('9')) {
        numero = '9' + numero;
      }
      numero = '54' + numero;
    }

    // 4. Armamos el mensaje y abrimos WhatsApp
    const msg = `Hola ${r.cliente_nombre.split(' ')[0]}, te hablo de Franci Seguros. Te recordamos que tu póliza ${r.numero_poliza} (${r.vehiculo}) vence el ${format(parseISO(r.vence_el), 'dd/MM')}. ¿Querés que la renovemos?`;

    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const dispararAlertaPush = async (poliza) => {

    // 1. Chequeamos cómo se llama realmente el ID (puede ser 'id' a secas)
    const idReal = poliza.id || poliza.id_poliza;

    // Si sigue sin encontrarlo, frenamos todo y te avisamos
    if (!idReal) {
      console.error("Datos de la póliza donde falta el ID:", poliza);
      toast.error('No se encontró el ID de la póliza para enviar la alerta.');
      return;
    }
    // Usamos un toast de "Cargando" porque Gemini tarda unos 2 o 3 segundos en pensar el mensaje
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

      toast.dismiss(loadingToast); // Cerramos el de cargando

      if (data.success) {
        toast.success(
          <div>
            <p className="font-bold">¡Mensaje enviado al celular!</p>
            <p className="text-xs italic mt-1">"{data.texto_generado}"</p>
          </div>
        );
      } else {
        toast.error(`No se pudo enviar el Push: ${data.mensaje}`);
        // Si no tiene Push, al menos le mostramos lo que pensó Gemini para que lo copie
        if (data.texto_generado) {
          console.log("Mensaje sugerido por Gemini:", data.texto_generado);
        }
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
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.dias_restantes <= 7 ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{r.cliente_nombre}</p>
                      <Badge variant={r.dias_restantes <= 7 ? "destructive" : "secondary"} className="text-[10px] px-1.5 h-5">
                        {r.dias_restantes} días
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase">{r.compania} · {r.vehiculo} {r.patente && `(${r.patente})`}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      Vence el {format(parseISO(r.vence_el), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2"
                    onClick={() => window.location.href = `/dashboard?dni=${r.cliente_dni}`}>
                    <Eye className="w-4 h-4" /> Perfil
                  </Button>
                  <Button size="sm" className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleWhatsApp(r)}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                  <button
                    onClick={() => dispararAlertaPush(r)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors ml-2"
                    title="Enviar Alerta Inteligente"
                  >
                    <BellRing className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}