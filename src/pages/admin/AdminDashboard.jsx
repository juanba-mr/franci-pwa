const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Users, AlertTriangle, DollarSign, RefreshCw, LogOut } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { differenceInDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { data: clientes = [] } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: () => db.entities.Cliente.list(),
  });

  const metrics = useMemo(() => {
    const today = new Date();
    let totalClientes = clientes.length;
    let vencimientosInminentes = 0;
    let totalACobrar = 0;
    const companiaMap = {};

    clientes.forEach(c => {
      (c.polizas || []).forEach(p => {
        if (p.vigencia_hasta) {
          const dias = differenceInDays(parseISO(p.vigencia_hasta), today);
          if (dias >= 0 && dias <= 7) vencimientosInminentes++;
        }
        if (p.estado_pago !== 'al_dia' && p.cuota_actual) {
          totalACobrar += p.cuota_actual;
        }
        const comp = p.compania || 'Sin compañía';
        companiaMap[comp] = (companiaMap[comp] || 0) + 1;
      });
    });

    const porCompania = Object.entries(companiaMap).map(([name, value]) => ({ name, value }));

    return { totalClientes, vencimientosInminentes, totalACobrar, porCompania };
  }, [clientes]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Panel Principal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vista general de la cartera</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => window.location.href = '/'}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Clientes Activos"
          value={metrics.totalClientes}
          icon={Users}
          sub="En cartera"
        />
        <MetricCard
          title="Vencimientos (7d)"
          value={metrics.vencimientosInminentes}
          icon={AlertTriangle}
          colorClass="text-amber-600"
          bgClass="bg-amber-500/10"
          sub="Requieren atención"
        />
        <MetricCard
          title="A Cobrar"
          value={`$${metrics.totalACobrar.toLocaleString()}`}
          icon={DollarSign}
          colorClass="text-red-600"
          bgClass="bg-red-500/10"
          sub="Cuotas pendientes"
        />
        <MetricCard
          title="Última Sincronización"
          value="Manual"
          icon={RefreshCw}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-500/10"
          sub="Usar Centro de Ingesta"
        />
      </div>

      {/* Chart */}
      {metrics.porCompania.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Pólizas por Compañía</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.porCompania} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {metrics.porCompania.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}