const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Filter, Loader2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import VigenciaBadge from '@/components/dashboard/VigenciaBadge';
import WhatsAppReminderModal from '@/components/admin/WhatsAppReminderModal';

export default function AdminRenovaciones() {
  const [filterCompania, setFilterCompania] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [sortDir, setSortDir] = useState('asc');
  const [modalData, setModalData] = useState(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: () => db.entities.Cliente.list(),
  });

  const rows = useMemo(() => {
    const today = new Date();
    const result = [];
    clientes.forEach(c => {
      (c.polizas || []).forEach((p, idx) => {
        if (!p.vigencia_hasta) return;
        const dias = differenceInDays(parseISO(p.vigencia_hasta), today);
        if (dias <= 30 && dias >= -5) {
          result.push({ cliente: c, poliza: p, idx, dias });
        }
      });
    });
    return result;
  }, [clientes]);

  const companias = [...new Set(rows.map(r => r.poliza.compania).filter(Boolean))];
  const tipos = [...new Set(rows.map(r => r.poliza.tipo_seguro).filter(Boolean))];

  const filtered = rows
    .filter(r => filterCompania === 'all' || r.poliza.compania === filterCompania)
    .filter(r => filterTipo === 'all' || r.poliza.tipo_seguro === filterTipo)
    .sort((a, b) => sortDir === 'asc' ? a.dias - b.dias : b.dias - a.dias);

  const urgentes = filtered.filter(r => r.dias <= 7).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Gestor de Renovaciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pólizas con vencimiento próximo (próximos 30 días)
          {urgentes > 0 && <span className="ml-1 text-amber-600 font-semibold">· {urgentes} urgentes</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <select
            value={filterCompania}
            onChange={e => setFilterCompania(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Todas las compañías</option>
            {companias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Mobile: cards */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-40 mb-2" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No hay pólizas próximas a vencer</p>
        ) : filtered.map(({ cliente, poliza, idx, dias }, i) => (
          <div key={i} className={`bg-card border border-border rounded-xl p-4 ${dias <= 7 ? 'border-amber-200 bg-amber-500/5' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm text-foreground">{cliente.nombre}</p>
                <p className="text-xs text-muted-foreground font-mono">{cliente.dni}</p>
              </div>
              <VigenciaBadge estado={poliza.estado} />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
              <p><span className="font-medium text-foreground">{poliza.tipo_seguro}</span> · {poliza.compania}</p>
              <p className="font-mono">{poliza.numero_poliza}</p>
              <p className={`font-semibold ${dias <= 0 ? 'text-red-600' : dias <= 7 ? 'text-amber-600' : 'text-foreground'}`}>
                Vence: {format(parseISO(poliza.vigencia_hasta), "d MMM yyyy", { locale: es })} ({dias <= 0 ? `hace ${Math.abs(dias)}d` : `en ${dias}d`})
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8"
              onClick={() => setModalData({ cliente, poliza })}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Enviar WhatsApp
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Póliza</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Compañía</th>
              <th
                className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              >
                <span className="flex items-center gap-1">
                  Vencimiento
                  {sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-full" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No hay pólizas próximas a vencer</td></tr>
            ) : filtered.map(({ cliente, poliza, idx, dias }, i) => (
              <tr key={i} className={`border-b border-border hover:bg-muted/30 transition-colors ${dias <= 7 ? 'bg-amber-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground font-mono">{cliente.dni}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{poliza.numero_poliza}</td>
                <td className="px-4 py-3 text-foreground">{poliza.tipo_seguro}</td>
                <td className="px-4 py-3 text-muted-foreground">{poliza.compania}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{format(parseISO(poliza.vigencia_hasta), "d MMM yyyy", { locale: es })}</p>
                  <p className={`text-xs font-semibold ${dias <= 0 ? 'text-red-600' : dias <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {dias <= 0 ? `Venció hace ${Math.abs(dias)} días` : `En ${dias} días`}
                  </p>
                </td>
                <td className="px-4 py-3"><VigenciaBadge estado={poliza.estado} /></td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8"
                    onClick={() => setModalData({ cliente, poliza })}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalData && (
        <WhatsAppReminderModal
          cliente={modalData.cliente}
          poliza={modalData.poliza}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
}